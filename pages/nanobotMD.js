import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// ─── Simple Markdown Renderer ────────────────────────────────────────────────

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(text) {
  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>');
  return text;
}

function MarkdownRenderer({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  const elements = [];
  let key = 0;

  for (const part of parts) {
    if (part.startsWith('```')) {
      const lines = part.split('\n');
      const lang = lines[0].replace('```', '').trim() || 'text';
      const code = lines.slice(1, -1).join('\n');
      elements.push(
        <div key={key++} className="code-block-wrapper">
          {lang && <span className="code-lang">{lang}</span>}
          <pre className="code-block"><code>{code}</code></pre>
        </div>
      );
    } else {
      const lines = part.split('\n');
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) { i++; continue; }

        // H1
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
          elements.push(<h1 key={key++} className="md-h1" dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(trimmed.slice(2))) }} />);
        }
        // H2
        else if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
          const h2text = trimmed.slice(3).replace(/`/g, '');
          const h2id = h2text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
          elements.push(<h2 key={key++} id={h2id} className="md-h2" dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(trimmed.slice(3))) }} />);
        }
        // H3
        else if (trimmed.startsWith('### ')) {
          elements.push(<h3 key={key++} className="md-h3" dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(trimmed.slice(4))) }} />);
        }
        // Blockquote
        else if (trimmed.startsWith('> ')) {
          const quoteLines = [];
          while (i < lines.length && lines[i].trim().startsWith('> ')) {
            quoteLines.push(lines[i].trim().slice(2));
            i++;
          }
          elements.push(
            <blockquote key={key++} className="md-blockquote">
              {quoteLines.map((ql, qi) => (
                <p key={qi} dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(ql)) }} />
              ))}
            </blockquote>
          );
          continue;
        }
        // HR
        else if (trimmed === '---') {
          elements.push(<hr key={key++} className="md-hr" />);
        }
        // Unordered list
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listItems = [];
          while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
            listItems.push(lines[i].trim().slice(2));
            i++;
          }
          elements.push(
            <ul key={key++} className="md-ul">
              {listItems.map((li, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(li)) }} />
              ))}
            </ul>
          );
          continue;
        }
        // Numbered list
        else if (/^\d+\.\s/.test(trimmed)) {
          const listItems = [];
          while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
            listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
            i++;
          }
          elements.push(
            <ol key={key++} className="md-ol">
              {listItems.map((li, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(li)) }} />
              ))}
            </ol>
          );
          continue;
        }
        // Regular paragraph
        else {
          const paraLines = [];
          while (i < lines.length) {
            const l = lines[i].trim();
            if (!l || l.startsWith('#') || l.startsWith('>') || l === '---' || l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s/.test(l)) break;
            paraLines.push(l);
            i++;
          }
          if (paraLines.length > 0) {
            elements.push(
              <p key={key++} className="md-p" dangerouslySetInnerHTML={{ __html: inlineFormat(escapeHtml(paraLines.join(' '))) }} />
            );
          }
          continue;
        }
        i++;
      }
    }
  }
  return <>{elements}</>;
}

// ─── Markdown Content ─────────────────────────────────────────────────────────

const MARKDOWN = `# Nanobot: Arquitectura Técnica y Guía de Funcionamiento Profundo

> **Framework open-source para construir agentes de IA autónomos que viven en tus plataformas de mensajería.**
> Desarrollado por el HKUDS Data Intelligence Lab. Escrito en Python 3.10+. Alrededor de 4,000 líneas de código listo para producción.

---

## ¿Qué es Nanobot exactamente?

Nanobot no es un chatbot. Es un **framework de agente autónomo** con acceso a herramientas reales — búsqueda web, sistema de archivos, terminal, sub-agentes, tareas programadas, y cualquier servicio externo vía MCP. La diferencia con un chatbot convencional es fundamental: mientras un chatbot solo habla, un agente de Nanobot puede *actuar* en el mundo.

El diseño parte de una premisa simple: **el LLM es el cerebro, Nanobot es el cuerpo**. El modelo de lenguaje decide qué hacer; Nanobot ejecuta las acciones, gestiona la memoria, enruta los mensajes entre plataformas, y mantiene el contexto de cada conversación de forma persistente en disco.

---

## Estructura de Directorios

\`\`\`
nanobot/
├── agent/              # El núcleo — cerebro del sistema
│   ├── loop.py         # AgentLoop: el motor de procesamiento central (~500 líneas)
│   ├── context.py      # ContextBuilder: construye el array de mensajes para el LLM (~250 líneas)
│   ├── skills.py       # Carga de skills (.md) al system prompt (~200 líneas)
│   ├── memory.py       # MemoryStore: MEMORY.md + HISTORY.md (~80 líneas)
│   ├── subagent.py     # SubagentManager: agentes hijos paralelos (~300 líneas)
│   └── tools/
│       ├── registry.py     # ToolRegistry: registro y despacho de tools (~100 líneas)
│       ├── base.py         # Clase base Tool abstracta (~120 líneas)
│       ├── filesystem.py   # read/write/edit/list de archivos (~250 líneas)
│       ├── shell.py        # Ejecución de comandos de terminal (~200 líneas)
│       ├── web.py          # Búsqueda web + fetch de URLs (~220 líneas)
│       ├── message.py      # Envío proactivo de mensajes (~100 líneas)
│       ├── spawn.py        # Creación de sub-agentes (~80 líneas)
│       ├── cron.py         # Tareas programadas (~180 líneas)
│       └── mcp.py          # Conexión a MCP servers externos (~100 líneas)
│
├── channels/           # Conectores a plataformas externas
│   ├── base.py         # Clase base Channel abstracta (~150 líneas)
│   ├── manager.py      # ChannelManager: activa canales según config (~300 líneas)
│   ├── telegram.py     # Conector Telegram completo (~400 líneas)
│   ├── slack.py        # Conector Slack con soporte de threads (~350 líneas)
│   ├── discord.py      # Conector Discord (~380 líneas)
│   ├── email.py        # IMAP/SMTP bidireccional (~550 líneas)
│   ├── feishu.py       # Feishu/Lark (~550 líneas)
│   ├── dingtalk.py     # DingTalk (~350 líneas)
│   ├── whatsapp.py     # WhatsApp Business API (~220 líneas)
│   ├── mochat.py       # MoChat enterprise (~1,400 líneas)
│   └── qq.py           # QQ messaging (~180 líneas)
│
├── bus/                # Sistema de mensajería interna
│   ├── events.py       # InboundMessage / OutboundMessage dataclasses (~60 líneas)
│   └── queue.py        # MessageBus: colas asyncio (~120 líneas)
│
├── providers/          # Abstracción del LLM
│   └── base.py         # LLMProvider via LiteLLM (~200 líneas)
│
├── session/            # Persistencia de conversaciones
│   └── manager.py      # SessionManager: historial JSON por usuario (~200 líneas)
│
├── config/             # Configuración y validación
│   └── schema.py       # Pydantic schema del config.json (~250 líneas)
│
├── cli/                # Interfaz de línea de comandos
│   └── ...             # Comandos nanobot agent / nanobot configure
│
├── cron/               # Servicio de tareas programadas
│   └── service.py      # CronService con persistencia (~200 líneas)
│
├── heartbeat/          # Monitoreo de salud
│   └── ...             # Verificación periódica del proceso
│
└── __main__.py         # Entry point
\`\`\`

---

## El Núcleo: agent/loop.py — AgentLoop

Este es el archivo más importante del proyecto. Contiene la clase AgentLoop, el motor que convierte mensajes entrantes en acciones y respuestas. Alrededor de 500 líneas que implementan el ciclo completo de razonamiento.

### Constructor y dependencias

\`\`\`python
class AgentLoop:
    def __init__(
        self,
        bus: MessageBus,           # Cola interna de mensajes
        provider: LLMProvider,     # Abstracción del modelo (Claude, GPT, etc.)
        workspace: Path,           # Directorio de trabajo del agente
        model: str | None,         # Nombre del modelo ("claude-3-5-sonnet...")
        max_iterations: int = 20,  # Máximo de rondas tool → LLM por mensaje
        temperature: float = 0.7,  # Creatividad del LLM
        max_tokens: int = 4096,    # Tokens máximos por respuesta
        memory_window: int = 50,   # Mensajes antes de consolidar memoria
        brave_api_key: str | None, # Para web_search
        exec_config: ExecToolConfig,    # Config de la tool de shell
        cron_service: CronService | None,  # Servicio de tareas programadas
        restrict_to_workspace: bool,       # Sandboxing de filesystem
        session_manager: SessionManager,   # Historial persistente
        mcp_servers: dict | None,          # MCP servers externos
    )
\`\`\`

El constructor inicializa en orden: el ContextBuilder, el SessionManager, el ToolRegistry, y el SubagentManager. Luego llama a _register_default_tools() que monta todas las herramientas disponibles en el registry.

### El ciclo principal: run()

\`\`\`python
async def run(self) -> None:
    self._running = True
    await self._connect_mcp()  # Conecta MCP servers (lazy, una sola vez)

    while self._running:
        try:
            msg = await asyncio.wait_for(
                self.bus.consume_inbound(),
                timeout=1.0      # No bloquea indefinidamente
            )
            response = await self._process_message(msg)
            if response:
                await self.bus.publish_outbound(response)
        except asyncio.TimeoutError:
            continue  # Normal — no hay mensajes, sigue esperando
\`\`\`

El loop principal es un bucle while async que consume mensajes de la cola interna con un timeout de 1 segundo. Esto permite que el sistema responda a señales de parada sin quedar colgado. Si no hay mensajes, simplemente continúa esperando.

### El motor de razonamiento: _run_agent_loop()

Este es el núcleo real del sistema. Implementa el patrón **ReAct** (Reasoning + Acting):

\`\`\`python
async def _run_agent_loop(
    self,
    initial_messages: list[dict],
    on_progress: Callable[[str], Awaitable[None]] | None = None,
) -> tuple[str | None, list[str]]:

    messages = initial_messages
    iteration = 0
    final_content = None
    tools_used: list[str] = []

    while iteration < self.max_iterations:
        iteration += 1

        # 1. Llama al LLM con el historial + tools disponibles
        response = await self.provider.chat(
            messages=messages,
            tools=self.tools.get_definitions(),
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        if response.has_tool_calls:
            # 2a. El LLM quiere usar herramientas — envía progreso al usuario
            if on_progress:
                clean = self._strip_think(response.content)
                await on_progress(clean or self._tool_hint(response.tool_calls))

            # 2b. Agrega la respuesta del asistente (con tool_calls) al historial
            messages = self.context.add_assistant_message(
                messages, response.content, tool_call_dicts,
                reasoning_content=response.reasoning_content,
            )

            # 2c. Ejecuta cada tool y agrega el resultado al historial
            for tool_call in response.tool_calls:
                tools_used.append(tool_call.name)
                result = await self.tools.execute(
                    tool_call.name, tool_call.arguments
                )
                messages = self.context.add_tool_result(
                    messages, tool_call.id, tool_call.name, result
                )
            # Vuelve a llamar al LLM con los resultados de las tools

        else:
            # 2d. El LLM dio respuesta final sin tools — terminamos
            final_content = self._strip_think(response.content)
            break

    return final_content, tools_used
\`\`\`

**El punto crítico:** cada vez que el LLM solicita una tool, su respuesta (incluyendo los tool_calls) se agrega al array messages, luego el resultado de ejecutar esa tool también se agrega como tool_result. En la siguiente iteración, el LLM ve todo el historial de decisiones y resultados anteriores, lo que le permite razonar encadenado. Este patrón es lo que hace que el agente pueda resolver tareas complejas de múltiples pasos.

### _strip_think() — Soporte para modelos reasoning

\`\`\`python
@staticmethod
def _strip_think(text: str | None) -> str | None:
    if not text:
        return None
    return re.sub(r"<think>[\s\S]*?</think>", "", text).strip() or None
\`\`\`

Modelos como DeepSeek-R1 o QwQ emiten bloques con su razonamiento interno. Nanobot los filtra automáticamente antes de enviar la respuesta al usuario. Esto hace que el framework sea compatible con modelos reasoning sin configuración adicional.

### Procesamiento de mensajes del sistema

Nanobot tiene un canal especial "system" para comunicación interna entre el agente principal y sus sub-agentes. Cuando un sub-agente termina una tarea, envía un InboundMessage con channel="system" y chat_id="original_channel:original_chat_id". El método _process_system_message() parsea ese routing para devolver la respuesta al canal correcto.

---

## El Bus de Mensajes: bus/

### events.py — Las unidades de comunicación

\`\`\`python
@dataclass
class InboundMessage:
    channel: str      # "telegram", "slack", "discord", "cli", "system"
    sender_id: str    # ID del usuario en la plataforma
    chat_id: str      # ID del chat/canal
    content: str      # Texto del mensaje
    media: list | None = None      # Imágenes, documentos adjuntos
    metadata: dict | None = None   # Datos extra del canal

    @property
    def session_key(self) -> str:
        return f"{self.channel}:{self.chat_id}"

@dataclass
class OutboundMessage:
    channel: str
    chat_id: str
    content: str
    metadata: dict | None = None
\`\`\`

Estos dos dataclasses son el contrato de comunicación de todo el sistema. Los canales producen InboundMessage; el agente produce OutboundMessage. El Bus los transporta.

### queue.py — MessageBus

\`\`\`python
class MessageBus:
    def __init__(self):
        self._inbound: asyncio.Queue[InboundMessage] = asyncio.Queue()
        self._outbound: asyncio.Queue[OutboundMessage] = asyncio.Queue()

    async def publish_inbound(self, msg: InboundMessage) -> None:
        await self._inbound.put(msg)

    async def consume_inbound(self) -> InboundMessage:
        return await self._inbound.get()

    async def publish_outbound(self, msg: OutboundMessage) -> None:
        await self._outbound.put(msg)

    async def consume_outbound(self) -> OutboundMessage:
        return await self._outbound.get()
\`\`\`

La implementación es intencionalmente simple: dos colas asyncio.Queue para mensajes entrantes y salientes. No hay Redis, no hay RabbitMQ, no hay dependencias externas. Para un agente single-process corriendo en Railway o Fly.io, esta arquitectura es suficiente y elimina una capa entera de complejidad operacional.

---

## Los Canales: channels/

### Patrón de diseño

Todos los canales heredan de BaseChannel y deben implementar:

\`\`\`python
class BaseChannel(ABC):
    @abstractmethod
    async def start(self, bus: MessageBus) -> None:
        """Inicia el listener del canal y publica mensajes en el bus."""

    @abstractmethod
    async def send(self, msg: OutboundMessage) -> None:
        """Envía un mensaje de vuelta a la plataforma."""

    @abstractmethod
    async def stop(self) -> None:
        """Detiene el canal limpiamente."""
\`\`\`

El ChannelManager lee la configuración, instancia únicamente los canales configurados, y lanza cada uno como una corrutina independiente. Los canales publican mensajes entrantes en el bus y consumen mensajes salientes del bus para enviarlos.

### Telegram (channels/telegram.py, ~400 líneas)

El canal de Telegram es el más rico en funcionalidades:

**Autenticación de usuarios:** Solo los usuarios listados en allowed_users pueden interactuar con el bot. Cualquier mensaje de otros usuarios es ignorado silenciosamente. Esta validación ocurre en la capa del canal, antes de que el mensaje llegue al agente.

\`\`\`python
if update.message.from_user.id not in self.allowed_users:
    return  # Ignora sin respuesta
\`\`\`

**Soporte de media:** El canal descarga imágenes y documentos enviados al bot y los incluye en el InboundMessage como bytes codificados en base64. El ContextBuilder los formatea apropiadamente para los LLMs multimodales.

**Comandos nativos:** /new inicia una sesión nueva (con consolidación de memoria en background). /help muestra los comandos disponibles.

**Feedback en tiempo real:** Mientras el agente procesa y usa herramientas, el canal envía actualizaciones de progreso al usuario vía el callback on_progress.

**Timeout handling:** El canal gestiona los timeouts de Telegram automáticamente, reiniciando el polling si la conexión se pierde.

### Email (channels/email.py, ~550 líneas)

El canal de email es el más complejo. Usa IMAP para monitorear la bandeja de entrada en un loop periódico, extrae el texto del cuerpo del correo, construye el sender_id desde la dirección de email del remitente, y responde vía SMTP manteniendo el thread del email.

---

## Las Herramientas: agent/tools/

### ToolRegistry (tools/registry.py)

El registry es un dict simple {name: Tool} que expone dos interfaces críticas:

\`\`\`python
def get_definitions(self) -> list[dict]:
    """Retorna las definiciones JSON Schema de todas las tools."""
    return [tool.get_definition() for tool in self._tools.values()]

async def execute(self, name: str, arguments: dict) -> str:
    """Ejecuta una tool por nombre y retorna el resultado como string."""
    tool = self._tools.get(name)
    if not tool:
        return f"Error: tool '{name}' not found"
    return await tool.execute(arguments)
\`\`\`

### Filesystem Tools (tools/filesystem.py, ~250 líneas)

Cuatro herramientas que operan sobre el sistema de archivos:

**read_file:** Lee el contenido de un archivo. Si restrict_to_workspace=True, verifica que la ruta esté dentro del directorio workspace.

**write_file:** Crea o sobreescribe un archivo. Crea directorios intermedios automáticamente.

**edit_file:** Edita partes específicas usando búsqueda de string exacto. Recibe old_str y new_str, verifica que old_str aparezca exactamente una vez, y hace el reemplazo.

**list_dir:** Lista el contenido de un directorio con información de tipo y tamaño.

### Shell Tool (tools/shell.py, ~200 líneas)

Ejecuta comandos en la terminal del sistema operativo:

\`\`\`python
class ExecTool(Tool):
    async def execute(self, arguments: dict) -> str:
        command = arguments["command"]
        working_dir = arguments.get("working_dir", self.working_dir)

        proc = await asyncio.create_subprocess_shell(
            command,
            cwd=working_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=self.timeout  # default: 30 segundos
            )
        except asyncio.TimeoutError:
            proc.kill()
            return f"Command timed out after {self.timeout}s"

        output = stdout.decode() + stderr.decode()
        return output[:8000]  # Limita el output para no saturar el contexto
\`\`\`

### Web Tools (tools/web.py, ~220 líneas)

**web_search:** Usa la API de Brave Search. Si no hay API key configurada, retorna un mensaje de error claro.

**web_fetch:** Descarga el contenido de una URL vía httpx, extrae el texto usando BeautifulSoup, y retorna el contenido limpio.

### Message Tool (tools/message.py, ~100 líneas)

Permite al agente enviar mensajes proactivos al usuario sin esperar una pregunta. Útil en tareas largas o en combinación con el cron service:

\`\`\`python
class MessageTool(Tool):
    async def execute(self, arguments: dict) -> str:
        content = arguments["content"]
        await self._send_callback(OutboundMessage(
            channel=self._channel,
            chat_id=self._chat_id,
            content=content,
        ))
        return "Message sent successfully"
\`\`\`

### Spawn Tool — Sub-agentes (tools/spawn.py + agent/subagent.py)

La feature más avanzada del framework. El spawn tool permite al agente principal crear agentes hijos que trabajan en paralelo. Cada sub-agente tiene su propio AgentLoop, ejecuta su tarea, y reporta el resultado vía el canal "system" del bus.

El caso de uso típico: el agente principal recibe una tarea compleja, la divide, lanza 3 sub-agentes en paralelo para cada subtarea, y cuando todos terminan consolida los resultados.

### MCP Tool (tools/mcp.py, ~100 líneas)

Model Context Protocol es el estándar de Anthropic para conectar herramientas externas a LLMs. Nanobot soporta servidores MCP vía stdio o HTTP/SSE:

\`\`\`python
async def connect_mcp_servers(
    servers: dict,
    tool_registry: ToolRegistry,
    stack: AsyncExitStack
) -> None:
    for name, config in servers.items():
        session = await stack.enter_async_context(...)
        tools_list = await session.list_tools()
        for mcp_tool in tools_list.tools:
            registry.register(MCPToolWrapper(session, mcp_tool))
\`\`\`

Esto significa que puedes conectar cualquier servidor MCP compatible (Notion, GitHub, bases de datos, APIs propias) y el LLM los verá como herramientas nativas.

---

## El Sistema de Contexto: agent/context.py

El ContextBuilder construye el array de mensajes que se envía al LLM en cada iteración:

\`\`\`python
def build_messages(
    self,
    history: list[dict],
    current_message: str,
    media: list | None,
    channel: str,
    chat_id: str,
) -> list[dict]:

    messages = []
    system_content = self._build_system_prompt(channel, chat_id)
    messages.append({"role": "system", "content": system_content})
    messages.extend(history)
    user_content = self._build_user_content(current_message, media)
    messages.append({"role": "user", "content": user_content})
    return messages
\`\`\`

El system prompt se construye dinámicamente en cada llamada e incluye el contenido de todos los archivos .md del directorio skills/ del workspace, el contenido actual de MEMORY.md, la fecha y hora actual del sistema, y el canal de origen.

---

## La Memoria: agent/memory.py y Consolidación

### MemoryStore

\`\`\`python
class MemoryStore:
    def __init__(self, workspace: Path):
        self.memory_file = workspace / "MEMORY.md"
        self.history_file = workspace / "HISTORY.md"

    def read_long_term(self) -> str:
        return self.memory_file.read_text() if self.memory_file.exists() else ""

    def write_long_term(self, content: str) -> None:
        self.memory_file.write_text(content)

    def append_history(self, entry: str) -> None:
        with open(self.history_file, "a") as f:
            f.write(f"\n{entry}\n")
\`\`\`

### Consolidación automática

Cuando una sesión supera memory_window mensajes (default: 50), se dispara una tarea de consolidación en background vía asyncio.create_task() — sin bloquear la respuesta al usuario:

\`\`\`python
async def _consolidate_memory(self, session, archive_all: bool = False) -> None:
    memory = MemoryStore(self.workspace)
    old_messages = session.messages[session.last_consolidated:-keep_count]

    prompt = f"""You are a memory consolidation agent. Return a JSON object with:
1. "history_entry": Summary (2-5 sentences) starting with [YYYY-MM-DD HH:MM]
2. "memory_update": Updated long-term memory with new facts about the user.

Current Memory:
{memory.read_long_term() or "(empty)"}

Conversation to Process:
{conversation}

Respond with ONLY valid JSON."""

    response = await self.provider.chat(...)
    result = json_repair.loads(response.content)

    if entry := result.get("history_entry"):
        memory.append_history(entry)
    if update := result.get("memory_update"):
        memory.write_long_term(update)
\`\`\`

El diseño usa json_repair (no json.loads) porque los LLMs a veces producen JSON con pequeños errores de formato.

---

## Sesiones: session/manager.py

Cada conversación se persiste como un archivo JSON con clave channel:chat_id:

\`\`\`json
{
    "key": "telegram:123456789",
    "messages": [
        {
            "role": "user",
            "content": "Hola, ¿cómo estás?",
            "timestamp": "2025-06-15T14:30:00"
        },
        {
            "role": "assistant",
            "content": "¡Hola! Estoy bien y listo para ayudarte.",
            "timestamp": "2025-06-15T14:30:02",
            "tools_used": []
        }
    ],
    "last_consolidated": 20,
    "created_at": "2025-06-15T10:00:00",
    "updated_at": "2025-06-15T14:32:10"
}
\`\`\`

El SessionManager mantiene un cache en memoria de las sesiones activas para evitar I/O constante a disco.

---

## Proveedores LLM: providers/

Nanobot usa **LiteLLM** como capa de abstracción, lo que significa que el mismo código funciona con:

- OpenAI (GPT-4o, GPT-4 Turbo, o1)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 4)
- Google (Gemini 1.5 Pro, Gemini 2.0)
- Meta (Llama 3 vía Groq o Together)
- OpenRouter (acceso unificado a +200 modelos)
- Cualquier endpoint compatible con OpenAI API

La configuración del modelo es simplemente un string:

\`\`\`
"openrouter/anthropic/claude-sonnet-4"   # vía OpenRouter
"claude-3-5-sonnet-20241022"             # Anthropic directo
"gpt-4o"                                 # OpenAI directo
"groq/llama-3.1-70b-versatile"          # Groq
\`\`\`

---

## El Cron Service: cron/service.py

El CronService permite programar tareas que se ejecutan automáticamente:

\`\`\`json
{
    "job_id": "morning-briefing",
    "schedule": "0 8 * * *",
    "task": "Busca las noticias principales de tecnología y envíame un resumen",
    "channel": "telegram",
    "chat_id": "123456789",
    "created_at": "2025-06-15T10:00:00"
}
\`\`\`

Cuando se dispara un job, el CronService crea un InboundMessage con el task como contenido y lo publica en el bus. El agente lo procesa exactamente igual que un mensaje normal del usuario.

---

## Configuración: config/schema.py

El schema completo de ~/.nanobot/config.json validado vía Pydantic:

\`\`\`python
class NanobotConfig(BaseModel):
    model: str = "gpt-4o"
    api_key: str
    api_base: str | None = None
    temperature: float = 0.7
    max_tokens: int = 4096
    max_iterations: int = 20
    memory_window: int = 50
    brave_api_key: str | None = None
    exec: ExecToolConfig = ExecToolConfig()
    restrict_to_workspace: bool = False
    workspace: str = "~/.nanobot/workspace"
    channels: ChannelsConfig = ChannelsConfig()
    mcp_servers: dict[str, MCPServerConfig] = {}
    heartbeat: HeartbeatConfig = HeartbeatConfig()

class TelegramConfig(BaseModel):
    bot_token: str
    allowed_users: list[int]    # IDs de usuarios autorizados
    admin_users: list[int] = []

class MCPServerConfig(BaseModel):
    command: str
    args: list[str]
    env: dict[str, str] = {}
\`\`\`

---

## Skills: Instrucciones en Markdown

Las skills son la forma de personalizar el comportamiento del agente sin tocar código. Son archivos .md que viven en workspace/skills/ y se inyectan automáticamente en el system prompt:

\`\`\`markdown
# Lia — Asistente Personal
Eres Lia, una asistente personal inteligente y proactiva.
Tu objetivo es ayudar a Alfredo con sus proyectos de IA y desarrollo.

## Personalidad
- Comunicativa pero concisa
- Proactiva: si detectas que algo podría hacerse mejor, sugérelo
- Técnica: puedes hablar de código, cloud, y arquitectura de sistemas

## Instrucciones de trabajo
- Cuando te pidan buscar información, siempre cita las fuentes
- Para tareas de código, verifica siempre que funciona antes de reportar éxito
- Guarda en MEMORY.md cualquier preferencia o decisión técnica importante
\`\`\`

El sistema de skills es jerárquico: puedes tener skills generales y skills específicas por dominio.

---

## Flujo Completo de un Mensaje

Para ilustrar todo el sistema funcionando en conjunto, este es el camino que recorre el mensaje *"Busca las noticias de IA de hoy y guárdalas en noticias.md"* enviado desde Telegram:

\`\`\`
1.  TELEGRAM → Recibe el mensaje vía long-polling
2.  TELEGRAM → Valida que el sender_id esté en allowed_users
3.  TELEGRAM → Crea InboundMessage(channel="telegram", content="Busca las noticias...")
4.  BUS      → publish_inbound(msg) → entra en la cola asyncio

5.  AGENTLOOP → consume_inbound() despierta con el mensaje
6.  AGENTLOOP → session.get_or_create("telegram:123456789")
7.  AGENTLOOP → context.build_messages(history, current_message, channel)
                 system: [MEMORY.md + skills/lia.md + fecha actual]
                 history: [últimos 30 mensajes de la sesión]
                 user: "Busca las noticias de IA de hoy..."

8.  PROVIDER  → provider.chat(messages, tools_definitions)
                LLM decide: voy a usar web_search

9.  TOOLS     → tools.execute("web_search", {"query": "AI news today 2025"})
                Llama a Brave API → retorna resultados

10. AGENTLOOP → Agrega tool_result al array de messages
11. PROVIDER  → LLM decide: ahora voy a usar write_file

12. TOOLS     → tools.execute("write_file", {"path": "noticias.md", "content": "..."})
                Escribe el archivo en workspace/

13. AGENTLOOP → Agrega tool_result al array de messages
14. PROVIDER  → LLM decide: no necesito más tools, tengo la respuesta final

15. AGENTLOOP → final_content = "He buscado las noticias de IA de hoy y..."
16. AGENTLOOP → session.add_message(...) → sessions.save(session)

17. BUS       → publish_outbound(OutboundMessage(channel="telegram", ...))
18. TELEGRAM  → consume_outbound() → bot.send_message(chat_id, final_content)
19. USUARIO   ← Recibe la respuesta en Telegram
\`\`\`

El tiempo total de este flujo con Claude Sonnet vía OpenRouter en Railway está típicamente entre 8 y 15 segundos para una tarea de 3 herramientas.

---

## Despliegue en Producción

### Railway (recomendado para empezar)

Railway detecta el Dockerfile del repositorio y construye la imagen automáticamente. Las variables de entorno se configuran en el dashboard y se mapean a las claves del config.json vía el script de entrypoint.

### Variables de entorno críticas

\`\`\`bash
# LLM
OPENROUTER_API_KEY=sk-or-v1-...     # O cualquier provider
NANOBOT_MODEL=openrouter/anthropic/claude-sonnet-4

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_USER_ID=123456789           # Tu user ID, NO el bot ID

# Opcionales
BRAVE_API_KEY=BSA...                 # Para web_search
NANOBOT_MAX_ITERATIONS=20
NANOBOT_TEMPERATURE=0.7
\`\`\`

### Persistencia en la nube

El workspace de Nanobot (sesiones, MEMORY.md, HISTORY.md, archivos generados) vive en el sistema de archivos del contenedor. Para producción se recomienda montar un volumen persistente para que los datos sobrevivan reinicios y nuevos deploys.

---

## Extensibilidad: Añadir Herramientas Personalizadas

Crear una tool personalizada requiere implementar la clase base y registrarla:

\`\`\`python
from nanobot.agent.tools.base import Tool

class MyCustomTool(Tool):
    name = "fetch_weather"
    description = "Get current weather for a city"

    def get_parameters(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }

    async def execute(self, arguments: dict) -> str:
        city = arguments["city"]
        result = await fetch_weather_api(city)
        return f"Weather in {city}: {result}"

# En tu código de inicialización:
agent_loop.tools.register(MyCustomTool())
\`\`\`

Nanobot también soporta la alternativa sin código vía MCP: si tu herramienta existe como servidor MCP, simplemente agrégala al config.json bajo mcp_servers y el agente la descubrirá automáticamente.

---

## Características Avanzadas

**Soporte multimodal:** Los canales que permiten adjuntos pueden pasar imágenes y documentos al LLM. El ContextBuilder formatea el contenido de forma diferente según el tipo: URLs de imagen para modelos con visión, o texto extraído para modelos solo-texto.

**Streaming de progreso:** El callback on_progress permite que el agente envíe actualizaciones intermedias mientras trabaja. El usuario recibe mensajes de estado como "🔍 Buscando información..." durante el procesamiento.

**Razonamiento extendido compatible:** El filtro _strip_think() hace que Nanobot sea compatible out-of-the-box con modelos que emiten tokens de razonamiento extendido (DeepSeek-R1, QwQ, o1).

**Sandboxing configurable:** Con restrict_to_workspace: true, el agente solo puede leer/escribir dentro del directorio workspace.

**Sub-agentes paralelos:** La tool spawn permite orquestar múltiples agentes especializados con el agente principal como coordinador.

---

## Estado Actual y Hoja de Ruta

Nanobot es un proyecto activo del HKUDS Data Intelligence Lab. El código base está en un estado de producción sólido — los ~4,000 líneas son código limpio, bien documentado con docstrings, y con manejo de errores consistente.

Las áreas de desarrollo activo incluyen más canales de mensajería, mejoras al sistema de memoria semántica (actualmente es búsqueda por grep en HISTORY.md, potencialmente puede mejorarse con embeddings), y más opciones de deployment.

Para proyectos basados en Nanobot como Lia ([@NanoPixanBot](https://t.me/NanoPixanBot)), el framework ofrece una base sólida que cubre el 90% de los casos de uso de un asistente personal autónomo con un setup mínimo.

---

*Documento generado a partir del análisis del código fuente de [github.com/HKUDS/nanobot](https://github.com/HKUDS/nanobot)*`;

// ─── Table of Contents extractor ─────────────────────────────────────────────

function extractTOC(md) {
  const headings = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      const text = h2[1].replace(/`/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
      headings.push({ text, id });
    }
  }
  return headings;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NanobotMD() {
  const [activeSection, setActiveSection] = useState('');
  const [showTOC, setShowTOC] = useState(false);
  const toc = extractTOC(MARKDOWN);
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    const headings = contentRef.current?.querySelectorAll('h2');
    headings?.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Nanobot: Arquitectura Técnica — pixan.ai</title>
        <meta name="description" content="Guía técnica profunda del framework Nanobot para construir agentes de IA autónomos." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="page-root">
        <header className="site-header">
          <nav className="site-nav">
            <a href="/" className="logo-link">
              <svg width="120" height="38" viewBox="0 0 163 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 12H3.49722V37.18H0V12Z" fill="#28106A"/>
                <path d="M14.9681 12H18.6612V30.3045H14.9681V12Z" fill="#D34C54"/>
                <path d="M7.27422 12H10.9673V30.3045H7.27422V12Z" fill="#28106A"/>
                <path d="M45.4261 46.8182V10.8182H50.4034V15.0625H50.8295C51.125 14.517 51.5511 13.8864 52.108 13.1705C52.6648 12.4545 53.4375 11.8295 54.4261 11.2955C55.4148 10.75 56.7216 10.4773 58.3466 10.4773C60.4602 10.4773 62.3466 11.0114 64.0057 12.0795C65.6648 13.1477 66.9659 14.6875 67.9091 16.6989C68.8636 18.7102 69.3409 21.1307 69.3409 23.9602C69.3409 26.7898 68.8693 29.2159 67.9261 31.2386C66.983 33.25 65.6875 34.8011 64.0398 35.892C62.392 36.9716 60.5114 37.5114 58.3977 37.5114C56.8068 37.5114 55.5057 37.2443 54.4943 36.7102C53.4943 36.1761 52.7102 35.5511 52.142 34.8352C51.5739 34.1193 51.1364 33.483 50.8295 32.9261H50.5227V46.8182H45.4261ZM50.4205 23.9091C50.4205 25.75 50.6875 27.3636 51.2216 28.75C51.7557 30.1364 52.5284 31.2216 53.5398 32.0057C54.5511 32.7784 55.7898 33.1648 57.2557 33.1648C58.7784 33.1648 60.0511 32.7614 61.0739 31.9545C62.0966 31.1364 62.8693 30.0284 63.392 28.6307C63.9261 27.233 64.1932 25.6591 64.1932 23.9091C64.1932 22.1818 63.9318 20.6307 63.4091 19.2557C62.8977 17.8807 62.125 16.7955 61.0909 16C60.0682 15.2045 58.7898 14.8068 57.2557 14.8068C55.7784 14.8068 54.5284 15.1875 53.5057 15.9489C52.4943 16.7102 51.7273 17.7727 51.2045 19.1364C50.6818 20.5 50.4205 22.0909 50.4205 23.9091Z" fill="#28106A"/>
                <path d="M75.0511 37V10.8182H80.1477V37H75.0511ZM77.625 6.77841C76.7386 6.77841 75.9773 6.48295 75.3409 5.89204C74.7159 5.28977 74.4034 4.57386 74.4034 3.74432C74.4034 2.90341 74.7159 2.1875 75.3409 1.59659C75.9773 0.994317 76.7386 0.693181 77.625 0.693181C78.5114 0.693181 79.267 0.994317 79.892 1.59659C80.5284 2.1875 80.8466 2.90341 80.8466 3.74432C80.8466 4.57386 80.5284 5.28977 79.892 5.89204C79.267 6.48295 78.5114 6.77841 77.625 6.77841Z" fill="#28106A"/>
                <path d="M91.027 10.8182L96.8054 21.0114L102.635 10.8182H108.209L100.044 23.9091L108.277 37H102.703L96.8054 27.2159L90.9247 37H85.3338L93.4815 23.9091L85.4361 10.8182H91.027Z" fill="#28106A"/>
                <path d="M121.014 37.5795C119.355 37.5795 117.855 37.2727 116.514 36.6591C115.173 36.0341 114.111 35.1307 113.327 33.9489C112.554 32.767 112.168 31.3182 112.168 29.6023C112.168 28.125 112.452 26.9091 113.02 25.9545C113.588 25 114.355 24.2443 115.321 23.6875C116.287 23.1307 117.366 22.7102 118.56 22.4261C119.753 22.142 120.969 21.9261 122.207 21.7784C123.776 21.5966 125.048 21.4489 126.026 21.3352C127.003 21.2102 127.713 21.0114 128.156 20.7386C128.599 20.4659 128.821 20.0227 128.821 19.4091V19.2898C128.821 17.8011 128.401 16.6477 127.56 15.8295C126.73 15.0114 125.491 14.6023 123.844 14.6023C122.128 14.6023 120.776 14.983 119.787 15.7443C118.81 16.4943 118.134 17.3295 117.759 18.25L112.969 17.1591C113.537 15.5682 114.366 14.2841 115.457 13.3068C116.56 12.3182 117.827 11.6023 119.259 11.1591C120.69 10.7045 122.196 10.4773 123.776 10.4773C124.821 10.4773 125.929 10.6023 127.099 10.8523C128.281 11.0909 129.384 11.5341 130.406 12.1818C131.44 12.8295 132.287 13.7557 132.946 14.9602C133.605 16.1534 133.935 17.7045 133.935 19.6136V37H128.957V33.4205H128.753C128.423 34.0795 127.929 34.7273 127.27 35.3636C126.611 36 125.764 36.5284 124.73 36.9489C123.696 37.3693 122.457 37.5795 121.014 37.5795ZM122.122 33.4886C123.531 33.4886 124.736 33.2102 125.736 32.6534C126.747 32.0966 127.514 31.3693 128.037 30.4716C128.571 29.5625 128.838 28.5909 128.838 27.5568V24.1818C128.656 24.3636 128.304 24.5341 127.781 24.6932C127.27 24.8409 126.685 24.9716 126.026 25.0852C125.366 25.1875 124.724 25.2841 124.099 25.375C123.474 25.4545 122.952 25.5227 122.531 25.5795C121.543 25.7045 120.639 25.9148 119.821 26.2102C119.014 26.5057 118.366 26.9318 117.878 27.4886C117.401 28.0341 117.162 28.7614 117.162 29.6705C117.162 30.9318 117.628 31.8864 118.56 32.5341C119.491 33.1705 120.679 33.4886 122.122 33.4886Z" fill="#28106A"/>
                <path d="M145.82 21.4545V37H140.723V10.8182H145.615V15.0795H145.939C146.541 13.6932 147.484 12.5795 148.768 11.7386C150.064 10.8977 151.695 10.4773 153.661 10.4773C155.445 10.4773 157.007 10.8523 158.348 11.6023C159.689 12.3409 160.729 13.4432 161.467 14.9091C162.206 16.375 162.575 18.1875 162.575 20.3466V37H157.479V20.9602C157.479 19.0625 156.984 17.5795 155.996 16.5114C155.007 15.4318 153.649 14.892 151.922 14.892C150.74 14.892 149.689 15.1477 148.768 15.6591C147.859 16.1705 147.138 16.9205 146.604 17.9091C146.081 18.8864 145.82 20.0682 145.82 21.4545Z" fill="#28106A"/>
                <path d="M140.7 10.82H145.98V36.99H140.7V10.82Z" fill="#D34C54"/>
              </svg>
            </a>
            <div className="nav-right">
              <button className="toc-toggle" onClick={() => setShowTOC(!showTOC)}>
                {showTOC ? '✕ Cerrar índice' : '☰ Índice'}
              </button>
              <a href="https://github.com/HKUDS/nanobot" target="_blank" rel="noopener" className="gh-btn">
                GitHub ↗
              </a>
            </div>
          </nav>
        </header>

        <div className="layout">
          <aside className={`sidebar ${showTOC ? 'sidebar-open' : ''}`}>
            <div className="toc-title">Contenido</div>
            <nav className="toc-nav">
              {toc.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`toc-item ${activeSection === h.id ? 'toc-active' : ''}`}
                  onClick={() => setShowTOC(false)}
                >
                  {h.text}
                </a>
              ))}
            </nav>
            <div className="toc-footer">
              <a href="https://github.com/HKUDS/nanobot" target="_blank" rel="noopener" className="toc-gh">
                Ver repositorio ↗
              </a>
            </div>
          </aside>

          <main className="content" ref={contentRef}>
            <div className="content-inner">
              <MarkdownRenderer content={MARKDOWN} />
              <div className="doc-footer">
                <p>Fuente: <a href="https://github.com/HKUDS/nanobot" target="_blank" rel="noopener">github.com/HKUDS/nanobot</a> · Publicado en <a href="https://pixan.ai">pixan.ai</a></p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          line-height: 1.7;
        }

        .site-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e9ecef;
          height: 64px;
        }
        .site-nav {
          max-width: 1400px; margin: 0 auto;
          padding: 0 24px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo-link { display: flex; align-items: center; }
        .logo-link svg { height: 32px; width: auto; }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .toc-toggle {
          display: none;
          background: #f8f9fa; border: 1px solid #e9ecef;
          padding: 8px 14px; border-radius: 6px;
          cursor: pointer; font-size: 14px; font-weight: 500; font-family: inherit;
          color: #28106A; transition: all 0.2s;
        }
        .toc-toggle:hover { background: #28106A; color: white; border-color: #28106A; }
        .gh-btn {
          text-decoration: none; color: #1a1a1a;
          background: #f8f9fa; border: 1px solid #e9ecef;
          padding: 8px 14px; border-radius: 6px;
          font-size: 14px; font-weight: 500; transition: all 0.2s;
        }
        .gh-btn:hover { background: #28106A; color: white; border-color: #28106A; }

        .layout {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: 260px 1fr;
          padding-top: 64px; min-height: 100vh;
        }
        .sidebar {
          position: sticky; top: 64px;
          height: calc(100vh - 64px); overflow-y: auto;
          padding: 32px 20px; border-right: 1px solid #e9ecef;
          display: flex; flex-direction: column; gap: 8px;
        }
        .toc-title {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #999; margin-bottom: 8px;
        }
        .toc-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .toc-item {
          text-decoration: none; color: #666;
          font-size: 13px; font-weight: 400;
          padding: 6px 10px; border-radius: 6px;
          transition: all 0.15s; line-height: 1.4;
          border-left: 2px solid transparent;
        }
        .toc-item:hover { color: #28106A; background: #f0edf8; }
        .toc-active { color: #28106A; font-weight: 600; border-left-color: #28106A; background: #f0edf8; }
        .toc-footer { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9ecef; }
        .toc-gh { text-decoration: none; color: #28106A; font-size: 13px; font-weight: 500; }
        .toc-gh:hover { text-decoration: underline; }

        .content { padding: 48px 64px 80px; }
        .content-inner { max-width: 800px; }

        .md-h1 {
          font-size: 2.4rem; font-weight: 700; line-height: 1.2;
          color: #28106A; margin-bottom: 16px; letter-spacing: -0.02em;
        }
        .md-h2 {
          font-size: 1.5rem; font-weight: 600; color: #1a1a1a;
          margin-top: 56px; margin-bottom: 16px;
          padding-top: 24px; border-top: 1px solid #e9ecef;
          scroll-margin-top: 90px; letter-spacing: -0.01em;
        }
        .md-h2:first-of-type { margin-top: 32px; }
        .md-h3 {
          font-size: 1.1rem; font-weight: 600; color: #28106A;
          margin-top: 32px; margin-bottom: 12px; scroll-margin-top: 90px;
        }
        .md-p { font-size: 1rem; color: #333; line-height: 1.75; margin-bottom: 16px; }
        .md-blockquote {
          border-left: 4px solid #28106A; background: #f6f4fc;
          padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;
        }
        .md-blockquote p { color: #444; font-size: 0.95rem; margin: 0; line-height: 1.6; }
        .md-hr { border: none; border-top: 1px solid #e9ecef; margin: 40px 0; }
        .md-ul, .md-ol { padding-left: 24px; margin-bottom: 16px; }
        .md-ul li, .md-ol li { color: #333; font-size: 1rem; line-height: 1.7; margin-bottom: 6px; }
        .md-ul li::marker { color: #28106A; }
        .md-ol li::marker { color: #28106A; font-weight: 600; }
        .inline-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.82em; font-weight: 500;
          background: #f0edf8; color: #28106A;
          padding: 2px 6px; border-radius: 4px; border: 1px solid #d8d0f0;
        }
        .md-link { color: #28106A; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
        .md-link:hover { color: #D34C54; }

        .code-block-wrapper {
          position: relative; margin: 24px 0;
          border-radius: 10px; overflow: hidden;
          border: 1px solid #e0ddf0; background: #0f0c1d;
        }
        .code-lang {
          display: block; background: #1e1a35; color: #9d93c8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 8px 16px; border-bottom: 1px solid #2a2448;
        }
        .code-block {
          overflow-x: auto; padding: 20px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 0.82rem; line-height: 1.65; color: #c8c0f0; white-space: pre;
        }
        .code-block code { font-family: inherit; background: none; padding: 0; color: inherit; }

        .doc-footer {
          margin-top: 64px; padding-top: 24px;
          border-top: 1px solid #e9ecef; color: #999; font-size: 13px;
        }
        .doc-footer a { color: #28106A; font-weight: 500; }

        @media (max-width: 1024px) {
          .toc-toggle { display: block; }
          .layout { grid-template-columns: 1fr; }
          .sidebar {
            position: fixed; left: 0; top: 64px;
            width: 280px; height: calc(100vh - 64px);
            background: #fff; z-index: 90;
            transform: translateX(-100%); transition: transform 0.3s;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          }
          .sidebar-open { transform: translateX(0); }
          .content { padding: 32px 24px 60px; }
        }
        @media (max-width: 600px) {
          .md-h1 { font-size: 1.8rem; }
          .md-h2 { font-size: 1.25rem; }
          .content { padding: 24px 16px 48px; }
          .code-block { font-size: 0.75rem; }
        }
      `}</style>
    </>
  );
}
