"""
server.py — Hội đồng Cố vấn AI (AI Advisory Council) Backend
================================================================

▸ Hướng dẫn cài đặt & chạy:
  ──────────────────────────
  1) Cài đặt dependencies:
       pip install fastapi uvicorn "agentscope<1.0" openai

  2) Thiết lập biến môi trường:
       Linux/Mac : export OPENAI_API_KEY="sk-..."
       Windows   : set OPENAI_API_KEY=sk-...
     (Tùy chọn)  export MODEL_NAME="gpt-4"       # Mặc định: gpt-3.5-turbo
     (Tùy chọn)  export PORT="8000"               # Mặc định: 8000

  3) Chạy server:
       python server.py
     Hoặc:
       uvicorn server:app --host 0.0.0.0 --port 8000 --reload

  4) Test nhanh:
       curl -X POST http://127.0.0.1:8000/api/ask \
         -H "Content-Type: application/json" \
         -d '{"question": "Viết hàm binary search bằng Python"}'
"""

import os
import asyncio
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import agentscope
from agentscope.agents import DialogAgent
from agentscope.message import Msg


# ╔══════════════════════════════════════════════════════════════╗
# ║  1. CẤU HÌNH CHUNG (Configuration)                         ║
# ╚══════════════════════════════════════════════════════════════╝

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
PORT = int(os.getenv("PORT", "8000"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-12s | %(levelname)-7s | %(message)s",
)
logger = logging.getLogger("ai-council")

# Cấu hình model cho AgentScope — dùng chung cho cả 3 agent
MODEL_CONFIG = {
    "config_name": "council_llm",
    "model_type": "openai_chat",
    "model_name": MODEL_NAME,
    "api_key": OPENAI_API_KEY,
    "temperature": 0.7,
    "max_tokens": 2048,
}


# ╔══════════════════════════════════════════════════════════════╗
# ║  2. SYSTEM PROMPTS — Tính cách cho từng Agent               ║
# ╚══════════════════════════════════════════════════════════════╝

CODER_SYSTEM_PROMPT = """\
Bạn là **CoderAgent** — Chuyên gia lập trình cao cấp trong Hội đồng Cố vấn AI.

### Nhiệm vụ
- Phân tích câu hỏi lập trình của người dùng một cách kỹ lưỡng.
- Viết ra giải pháp code **hoàn chỉnh**, có comment giải thích.
- Chọn thuật toán/cấu trúc dữ liệu phù hợp nhất.
- Giải thích ngắn gọn logic và cách tiếp cận đã chọn.

### Quy tắc
- Code phải chạy được ngay (production-ready nếu có thể).
- Đặt tên biến/hàm rõ ràng, dễ hiểu.
- Trả lời bằng **cùng ngôn ngữ** mà người dùng sử dụng trong câu hỏi.
- KHÔNG review hay tối ưu — chỉ tập trung viết giải pháp ban đầu.
"""

REVIEWER_SYSTEM_PROMPT = """\
Bạn là **ReviewerAgent** — Chuyên gia Review Code & Bảo mật trong Hội đồng Cố vấn AI.

### Nhiệm vụ
- Đọc kỹ đoạn code được cung cấp bởi CoderAgent.
- Phát hiện: bug, lỗi logic, edge cases bị bỏ sót, lỗ hổng bảo mật.
- Đánh giá: độ phức tạp thuật toán (Big-O), khả năng mở rộng, code style.
- Đề xuất cải thiện **cụ thể** với giải thích rõ ràng.

### Quy tắc
- Phân tích có hệ thống theo các tiêu chí: Correctness → Security → Performance → Readability.
- Nếu code tốt, vẫn phải chỉ ra ít nhất 1-2 điểm có thể cải thiện.
- KHÔNG viết lại code — chỉ review và gợi ý.
- Trả lời bằng cùng ngôn ngữ của đoạn code/câu hỏi gốc.
"""

OPTIMIZER_SYSTEM_PROMPT = """\
Bạn là **OptimizerAgent** — Chuyên gia Tối ưu hóa & Tổng kết trong Hội đồng Cố vấn AI.

### Nhiệm vụ
- Nhận: câu hỏi gốc + code từ CoderAgent + nhận xét từ ReviewerAgent.
- Tổng hợp tất cả và viết lại **phiên bản code tối ưu cuối cùng**.
- Giải thích rõ những thay đổi đã thực hiện so với bản gốc và lý do.

### Quy tắc
- Code cuối cùng phải: chạy được, tối ưu, an toàn, dễ đọc.
- Áp dụng best practices của ngôn ngữ lập trình đang dùng.
- Trình bày kết quả theo format rõ ràng:
  1) **Giải pháp tối ưu** (code hoàn chỉnh)
  2) **Tóm tắt cải tiến** (so với bản gốc)
  3) **Ghi chú** (nếu có lưu ý quan trọng)
- Đây là câu trả lời **cuối cùng** gửi đến người dùng — phải hoàn chỉnh và chuyên nghiệp.
"""


# ╔══════════════════════════════════════════════════════════════╗
# ║  3. KHỞI TẠO AGENTS & FASTAPI APP                          ║
# ╚══════════════════════════════════════════════════════════════╝

# Biến global giữ 3 agent instance (khởi tạo 1 lần khi server start)
coder_agent: DialogAgent = None
reviewer_agent: DialogAgent = None
optimizer_agent: DialogAgent = None

# Lock đảm bảo chỉ 1 pipeline chạy tại 1 thời điểm
# (tránh xung đột memory giữa các request đồng thời)
pipeline_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle hook: Khởi tạo AgentScope + 3 Agent khi server khởi động,
    dọn dẹp khi server tắt.
    """
    global coder_agent, reviewer_agent, optimizer_agent

    logger.info("🚀 Đang khởi tạo AgentScope với model: %s", MODEL_NAME)
    agentscope.init(model_configs=[MODEL_CONFIG])

    coder_agent = DialogAgent(
        name="CoderAgent",
        sys_prompt=CODER_SYSTEM_PROMPT,
        model_config_name="council_llm",
    )
    reviewer_agent = DialogAgent(
        name="ReviewerAgent",
        sys_prompt=REVIEWER_SYSTEM_PROMPT,
        model_config_name="council_llm",
    )
    optimizer_agent = DialogAgent(
        name="OptimizerAgent",
        sys_prompt=OPTIMIZER_SYSTEM_PROMPT,
        model_config_name="council_llm",
    )

    logger.info("✅ Hội đồng Cố vấn AI đã sẵn sàng! (3 agents loaded)")
    yield
    logger.info("🛑 AI Council server shutting down...")


app = FastAPI(
    title="AI Advisory Council API",
    description="Multi-agent pipeline: Coder → Reviewer → Optimizer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ╔══════════════════════════════════════════════════════════════╗
# ║  4. PYDANTIC MODELS (Request / Response)                    ║
# ╚══════════════════════════════════════════════════════════════╝

class AskRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        examples=["Viết hàm sắp xếp nhanh (quicksort) bằng Python"],
    )


class AskResponse(BaseModel):
    coder_output: str
    reviewer_output: str
    final_answer: str


# ╔══════════════════════════════════════════════════════════════╗
# ║  5. PIPELINE HỘI ĐỒNG CỐ VẤN (Core Logic)                 ║
# ╚══════════════════════════════════════════════════════════════╝

def run_council_pipeline(question: str) -> dict:
    """
    Chạy pipeline tuần tự 3 bước (synchronous, chạy trong thread riêng):

        User Question
              │
              ▼
        ┌─────────────┐
        │ CoderAgent   │ ──► Viết code giải pháp
        └──────┬──────┘
               ▼
        ┌──────────────────┐
        │ ReviewerAgent    │ ──► Review, tìm bug
        └──────┬───────────┘
               ▼
        ┌──────────────────┐
        │ OptimizerAgent   │ ──► Tổng hợp & tối ưu
        └──────┬───────────┘
               ▼
          Final Answer
    """
    with pipeline_lock:
        # ── Reset memory từ request trước (stateless API) ──
        for agent in [coder_agent, reviewer_agent, optimizer_agent]:
            if hasattr(agent, "memory") and agent.memory is not None:
                try:
                    agent.memory.clear()
                except Exception:
                    pass  # Tương thích nhiều phiên bản AgentScope

        # ── Bước 1: CoderAgent nhận câu hỏi gốc ──
        logger.info("📝 [Bước 1/3] CoderAgent đang viết giải pháp...")
        user_msg = Msg(
            name="User",
            content=question,
            role="user",
        )
        coder_response = coder_agent(user_msg)
        coder_text = coder_response.content
        logger.info("✅ CoderAgent hoàn thành (%d ký tự)", len(coder_text))

        # ── Bước 2: ReviewerAgent review code của CoderAgent ──
        logger.info("🔍 [Bước 2/3] ReviewerAgent đang review...")
        review_input = Msg(
            name="CoderAgent",
            content=(
                f"Câu hỏi gốc của người dùng: \"{question}\"\n\n"
                f"Dưới đây là giải pháp của CoderAgent. "
                f"Hãy review kỹ lưỡng:\n\n{coder_text}"
            ),
            role="user",
        )
        reviewer_response = reviewer_agent(review_input)
        reviewer_text = reviewer_response.content
        logger.info("✅ ReviewerAgent hoàn thành (%d ký tự)", len(reviewer_text))

        # ── Bước 3: OptimizerAgent tổng hợp cả 2 output ──
        logger.info("⚡ [Bước 3/3] OptimizerAgent đang tối ưu hóa...")
        optimize_input = Msg(
            name="Council",
            content=(
                f"## Câu hỏi gốc từ người dùng:\n{question}\n\n"
                f"---\n"
                f"## Giải pháp từ CoderAgent:\n{coder_text}\n\n"
                f"---\n"
                f"## Nhận xét từ ReviewerAgent:\n{reviewer_text}\n\n"
                f"---\n"
                f"Hãy tổng hợp tất cả thông tin trên và đưa ra "
                f"**giải pháp tối ưu cuối cùng** cho người dùng."
            ),
            role="user",
        )
        optimizer_response = optimizer_agent(optimize_input)
        final_text = optimizer_response.content
        logger.info("✅ OptimizerAgent hoàn thành (%d ký tự)", len(final_text))

        return {
            "coder_output": coder_text,
            "reviewer_output": reviewer_text,
            "final_answer": final_text,
        }


# ╔══════════════════════════════════════════════════════════════╗
# ║  6. API ENDPOINTS                                           ║
# ╚══════════════════════════════════════════════════════════════╝

@app.post("/api/ask", response_model=AskResponse)
async def ask_council(request: AskRequest):
    """
    Gửi câu hỏi tới Hội đồng Cố vấn AI.
    Pipeline chạy trong thread riêng để không block event loop.
    """
    try:
        logger.info("📨 Nhận câu hỏi: %s", request.question[:80])

        # Chạy pipeline đồng bộ trong thread pool (non-blocking cho FastAPI)
        result = await asyncio.to_thread(run_council_pipeline, request.question)

        logger.info("📤 Trả kết quả thành công!")
        return AskResponse(**result)

    except Exception as e:
        logger.error("❌ Lỗi pipeline: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI Council pipeline error: {str(e)}",
        )


@app.get("/health")
async def health_check():
    """Endpoint kiểm tra server còn sống không."""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "agents": ["CoderAgent", "ReviewerAgent", "OptimizerAgent"],
    }


# ╔══════════════════════════════════════════════════════════════╗
# ║  7. ENTRY POINT                                             ║
# ╚══════════════════════════════════════════════════════════════╝

if __name__ == "__main__":
    import uvicorn

    logger.info("🌐 Khởi chạy AI Council API tại http://0.0.0.0:%d", PORT)
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,       # Đặt True khi dev
        log_level="info",
    )