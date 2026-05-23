-- Supabase Storage: bucket para PDFs/Word de proyectos por perfil inversor
-- Ejecutar en Supabase → SQL Editor (una vez por proyecto)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'proyectos',
    'proyectos',
    true,
    10485760,
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de objetos (URLs en BD apuntan a /object/public/proyectos/...)
DROP POLICY IF EXISTS "proyectos_public_read" ON storage.objects;
CREATE POLICY "proyectos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'proyectos');

-- Escritura solo vía service_role desde el backend (no expone anon upload)
-- Si usa anon key en frontend, añada política INSERT con auth.uid() = (storage.foldername(name))[1]::uuid

COMMENT ON TABLE storage.buckets IS 'Bucket proyectos: ruta {user_id}/{profile_id}/{archivo}';
