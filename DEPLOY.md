# 🚀 Guía de Deployment - Trompocostos

## Pasos para Deployar a Firebase Hosting

### 1. Descarga los Íconos (Si aún no lo hiciste)

1. Abre `generate-icon.html` en tu navegador
2. Haz click en ambos botones de descarga
3. Guarda `icon-192.png` y `icon-512.png` en la carpeta `public/`
4. Reemplaza los archivos existentes

### 2. Build de Producción

```bash
npm run build
```

Esto creará la carpeta `dist/` con la app optimizada.

### 3. Login en Firebase (Solo primera vez)

Abre una terminal y ejecuta:

```bash
firebase login
```

Se abrirá tu navegador para autenticarte con Google.
Usa la misma cuenta de Google que usas para Firebase Console.

### 4. Verificar Proyecto

```bash
firebase projects:list
```

Deberías ver "trompocostos-app" en la lista.

### 5. Deploy

```bash
firebase deploy --only hosting
```

¡Listo! Tu app estará disponible en:
**https://trompocostos-app.web.app**

---

## 🔄 Para Actualizar la App (Después del primer deploy)

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en el código
# 2. Commit a Git (opcional pero recomendado)
git add .
git commit -m "Descripción de cambios"
git push origin main

# 3. Build
npm run build

# 4. Deploy
firebase deploy --only hosting
```

---

## 📱 Configurar Dominios Autorizados en Firebase

**IMPORTANTE**: Después del primer deploy, debes agregar el dominio a Firebase Auth:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona "trompocostos-app"
3. **Authentication** → **Settings** → **Authorized domains**
4. Agrega: `trompocostos-app.web.app`
5. Opcionalmente agrega: `trompocostos-app.firebaseapp.com`

---

## 🎨 Actualizar PWA en Celulares

Después de deployar, los usuarios que ya instalaron la PWA verán la actualización automáticamente:

1. La próxima vez que abran la app
2. Se descargará la nueva versión en segundo plano
3. Al recargar, verán los cambios

Para forzar actualización inmediata:
- Cierra la app completamente
- Vuelve a abrirla
- Verás la nueva versión

---

## 🔧 Comandos Útiles

```bash
# Ver logs del deploy
firebase hosting:channel:list

# Deploy a un canal de preview (testing)
firebase hosting:channel:deploy preview

# Ver uso de Firebase
firebase projects:list
```

---

## 📦 Estructura de Archivos

```
trompocostos/
├── dist/              # Build de producción (se genera con npm run build)
├── public/            # Archivos estáticos
│   ├── icon-192.png   # Ícono PWA pequeño
│   ├── icon-512.png   # Ícono PWA grande
│   └── favicon.ico    # Favicon navegador
├── src/               # Código fuente
├── firebase.json      # Configuración de Firebase Hosting
├── .firebaserc        # Proyecto Firebase activo
└── vite.config.ts     # Configuración PWA
```

---

## ✅ Checklist Post-Deploy

- [ ] App accesible en https://trompocostos-app.web.app
- [ ] Login con Google funciona
- [ ] Dominio agregado a Firebase Auth Authorized Domains
- [ ] PWA instalable desde el navegador móvil
- [ ] Íconos se ven correctamente
- [ ] Service Worker funciona (modo offline)
- [ ] Theme color correcto (#111827)

---

## 🐛 Troubleshooting

### "Unauthorized domain" al hacer login
→ Agrega el dominio en Firebase Console → Authentication → Authorized domains

### PWA no se instala
→ Verifica que manifest.webmanifest se esté generando en dist/
→ Revisa la consola del navegador (F12) en la pestaña "Application"

### Cambios no se ven después de deploy
→ Limpia caché del navegador (Ctrl + Shift + R)
→ Espera 1-2 minutos para propagación de CDN

### Build falla
→ Verifica que no haya errores de TypeScript con `npm run type-check`
→ Limpia node_modules y reinstala: `rm -rf node_modules && npm install`

---

## 📊 Monitoreo

Después del deploy, puedes ver analytics en:
- [Firebase Console - Hosting](https://console.firebase.google.com/)
- Analytics → Eventos
- Performance Monitoring

---

## 🎯 Próximos Pasos Opcionales

1. **Custom Domain**: Agrega tu propio dominio (ej: trompocostos.com)
2. **GitHub Actions**: Automatiza deploy con cada push
3. **Preview Channels**: Crea URLs de preview para testing
4. **Analytics**: Configura Google Analytics 4
5. **Performance**: Optimiza bundle size con code splitting
