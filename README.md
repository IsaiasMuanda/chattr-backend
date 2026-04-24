# chattr

Aplicação de chat em tempo real com autenticação, troca de mensagens instantânea e suporte a imagens.

Projeto desenvolvido para aprofundar conhecimentos em arquitectura de APIs REST, comunicação bidirecional com WebSockets e boas práticas de segurança em Node.js.

→ **Frontend:** [github.com/IsaiasMuanda/chattr-frontend](https://github.com/IsaiasMuanda)  
→ **Demo:** https://chattr-frontend-three.vercel.app/

---

## Funcionalidades

- Autenticação segura com JWT em cookie HTTP-only
- Mensagens em tempo real via Socket.io
- Envio de imagens com upload para Cloudinary
- Indicador de utilizadores online
- Rate limiting nas rotas de autenticação
- Paginação de mensagens por cursor

## Stack e decisões técnicas

| Tecnologia | Motivo da escolha |
|---|---|
| **Node.js + Express** | Leveza e ecosistema maduro para APIs |
| **MongoDB + Mongoose** | Esquema flexível adequado a mensagens; índices compostos para queries de conversa |
| **Socket.io** | Abstracção robusta sobre WebSocket com fallback automático |
| **JWT + cookie HTTP-only** | Protege contra XSS sem expor o token ao JavaScript do cliente |
| **Cloudinary** | Elimina a necessidade de gerir armazenamento de ficheiros no servidor |
| **helmet + rate-limit** | Camada de segurança mínima para produção |

## Arquitectura

```
src/
├── controllers/      # Lógica de negócio separada das rotas
├── middleware/       # Protecção de rotas (JWT)
├── models/           # Esquemas Mongoose com validação
├── routes/           # Definição de endpoints
└── lib/              # Utilitários: DB, Socket, Cloudinary, JWT
```

A separação em camadas (routes → controllers → models) facilita testes e manutenção. O Socket.io partilha o mesmo servidor HTTP do Express, evitando a necessidade de uma porta separada.

## API

<details>
<summary><strong>Autenticação</strong> — <code>/api/auth</code></summary>

| Método | Rota | Protegida | Descrição |
|--------|------|-----------|-----------|
| POST | `/signup` | ✗ | Criar conta |
| POST | `/login` | ✗ | Entrar |
| POST | `/logout` | ✗ | Sair |
| GET | `/check` | ✓ | Verificar sessão activa |
| PUT | `/update` | ✓ | Actualizar nome, bio, foto, senha |
| DELETE | `/delete` | ✓ | Remover conta |
| GET | `/profile/:id` | ✓ | Ver perfil de utilizador |

</details>

<details>
<summary><strong>Mensagens</strong> — <code>/api/messages</code></summary>

| Método | Rota | Protegida | Descrição |
|--------|------|-----------|-----------|
| GET | `/users` | ✓ | Listar contactos |
| GET | `/chat/:id` | ✓ | Histórico paginado |
| POST | `/send/:id` | ✓ | Enviar mensagem (texto ou imagem) |

</details>

**Eventos Socket.io**

```
cliente → servidor   handshake com ?userId=...
servidor → cliente   getOnlineUsers   lista de IDs online
servidor → cliente   newMessage       nova mensagem em tempo real
```

## Correr localmente

```bash
git clone https://github.com/IsaiasMuanda/chattr-backend.git
cd chattr-backend
npm install
cp .env.example .env   # preenche as variáveis
npm run dev
```

**Variáveis necessárias** (ver `.env.example`):

```
MONGODB_URI          URI do MongoDB Atlas
JWT_SECRET           String aleatória longa (mín. 32 chars)
CLOUDINARY_*         Credenciais Cloudinary
ALLOWED_ORIGINS      URL do frontend (ex: http://localhost:5173)
```

## Deploy

Backend em produção no **Render** — [ver guia](https://render.com/docs/deploy-node-express-app).

```
Build Command   npm install
Start Command   npm start
Node Version    20
```

---

Feito por [Isaias Muanda](https://isaias.vercel.app)
