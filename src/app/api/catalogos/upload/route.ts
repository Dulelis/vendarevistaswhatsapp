import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET_NAME = "catalogos-digitais";
const MAX_CATALOGO_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function sanitizeSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureBucket() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Falha ao consultar buckets: ${listError.message}`);
  }

  const exists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: MAX_CATALOGO_FILE_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      },
    );

    if (createError) {
      throw new Error(`Falha ao criar bucket: ${createError.message}`);
    }
  } else {
    const { error: updateError } = await supabase.storage.updateBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: MAX_CATALOGO_FILE_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      },
    );

    if (updateError) {
      throw new Error(`Falha ao atualizar bucket: ${updateError.message}`);
    }
  }

  return supabase;
}

export async function POST(request: Request) {
  try {
    const { protectionEnabled, isAdmin } = await getAuthenticatedAdmin();

    if (protectionEnabled && !isAdmin) {
      return NextResponse.json(
        { ok: false, message: "Apenas administradores podem enviar catalogos." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const titulo = String(formData.get("titulo") ?? "catalogo");
    const edicao = String(formData.get("edicao") ?? "digital");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Nenhum arquivo foi enviado." },
        { status: 400 },
      );
    }

    if (!file.size) {
      return NextResponse.json(
        { ok: false, message: "O arquivo enviado esta vazio." },
        { status: 400 },
      );
    }

    if (file.size > MAX_CATALOGO_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          message: "O arquivo excede o limite de 50 MB.",
        },
        { status: 400 },
      );
    }

    const supabase = await ensureBucket();
    const safeTitle = sanitizeSegment(titulo) || "catalogo";
    const safeEdition = sanitizeSegment(edicao) || "edicao";
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()
      : "pdf";
    const path = `${safeTitle}/${safeEdition}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, message: uploadError.message },
        { status: 400 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      publicUrl,
      fileName: file.name,
      path,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Falha no upload do catalogo.",
      },
      { status: 500 },
    );
  }
}
