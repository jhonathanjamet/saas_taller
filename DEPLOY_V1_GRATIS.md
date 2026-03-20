# Deploy V1 Gratis (TallerHub) - Paso a Paso

Esta es la ruta mas simple para dejar tu v1 online sin costo inicial:

- Frontend: Vercel (Hobby)
- Backend: Render (Free)
- Base de datos: Neon PostgreSQL (Free)

## 0) Reglas rapidas de seguridad

- No compartas tu clave principal de GitHub/Render/Vercel/Neon.
- Si necesitas dar acceso, usa usuarios invitados o tokens revocables.
- Guarda secretos largos para JWT (minimo 32 caracteres).

## 1) Preparar repo en GitHub (una vez)

Ejecuta en terminal (dentro de `/Users/jjamet/Downloads/saas_taller`):

```bash
git init
git add .
git commit -m "deploy v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si ya tienes repo, solo usa `git add`, `git commit`, `git push`.

## 2) Crear base de datos en Neon

1. Entra a Neon y crea proyecto.
2. Crea DB `tallerhub`.
3. Copia `DATABASE_URL` con SSL (debe traer `?sslmode=require`).

## 3) Desplegar backend en Render

Este proyecto ya trae `render.yaml` listo.

1. En Render: `New` -> `Blueprint`.
2. Conecta tu repo de GitHub.
3. Selecciona branch `main`.
4. Render creara el servicio `tallerhub-api`.
5. En Environment agrega:
   - `DATABASE_URL` = URL de Neon
   - `JWT_ACCESS_SECRET` = secreto largo
   - `JWT_REFRESH_SECRET` = otro secreto largo
6. Espera deploy.

Pruebas:

- `https://TU_BACKEND.onrender.com/api/health`
- `https://TU_BACKEND.onrender.com/api/docs`

## 4) Aplicar seed inicial (usuario admin demo) en Neon

Hazlo desde tu maquina local (mas simple que usar Shell cloud):

```bash
cd /Users/jjamet/Downloads/saas_taller
DATABASE_URL="postgresql://...neon..." npm run prisma:seed
```

Esto deja usuario demo y datos base.

## 5) Desplegar frontend en Vercel

1. En Vercel: `Add New...` -> `Project`.
2. Importa el mismo repo.
3. Configura:
   - Framework: Next.js
   - Root Directory: `web`
4. Variables de entorno:
   - `NEXT_PUBLIC_API_URL=https://TU_BACKEND.onrender.com/api`
5. Deploy.

## 6) Checklist final

1. Abre frontend de Vercel.
2. Inicia sesion con:
   - Email: `admin@demotaller.cl`
   - Password: `Admin123!`
3. Crea cliente.
4. Crea orden.
5. Verifica `/api/docs` en backend.

## 7) Problemas comunes

- `Cannot GET /login`: estas abriendo backend en vez de frontend.
- `Unauthorized` en frontend: token vencido, cierra sesion y vuelve a entrar.
- Render en frio: en plan Free puede tardar en "despertar".

## 8) Nota de operacion real

Esta arquitectura sirve para piloto/demo.
Para uso comercial continuo, migra a planes pagos para evitar hibernacion.
