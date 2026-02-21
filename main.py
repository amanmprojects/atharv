import os
import warnings
import threading

# Must be set before huggingface_hub / transformers are imported
os.environ["HF_HUB_VERBOSITY"] = "error"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
warnings.filterwarnings("ignore")

import torch
import transformers
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

transformers.logging.set_verbosity_error()

# Suppress the background Thread-auto_conversion exception (fired when the
# model has no safetensors weights and we have no HF token to request conversion)
_original_excepthook = threading.excepthook
def _quiet_excepthook(args):
    if args.thread and "auto_conversion" in args.thread.name:
        return
    _original_excepthook(args)
threading.excepthook = _quiet_excepthook

model_name = "alykassem/FLAN-T5-Paraphraser"

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device == "cuda" else ""))

tokenizer = AutoTokenizer.from_pretrained(model_name)

model = AutoModelForSeq2SeqLM.from_pretrained(
    model_name,
    tie_word_embeddings=False,
).to(device)

print("Type your text to paraphrase, or 'exit' / Ctrl-C to quit.\n")

while True:
    try:
        text = input(">>> ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        break

    if not text:
        continue
    if text.lower() in ("exit", "quit"):
        break

    inputs = tokenizer(f"Paraphrase: {text}", return_tensors="pt").to(device)
    outputs = model.generate(**inputs)
    print(tokenizer.decode(outputs[0], skip_special_tokens=True))
