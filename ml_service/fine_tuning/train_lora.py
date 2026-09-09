"""
EDEN LoRA Fine-Tuning Pipeline
EduSphere AI-Powered Student Lifecycle Management Ecosystem

Fine-tunes an open-source base LLM (Gemma-2, Qwen2.5, Llama-3.2) using QLoRA
on the curated EduSphere EDEN educational dataset.
"""

import json
import importlib
from pathlib import Path
import yaml

CONFIG_PATH = Path(__file__).parent / "eden_train_config.yaml"
DATASET_PATH = Path(__file__).parent / "datasets" / "eden_master_train.jsonl"


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def prepare_dataset_records(dataset_path):
    """Loads and formats dataset into standard ChatML / Alpaca prompt format."""
    records = []
    if not dataset_path.exists():
        print(f"⚠️ Dataset file not found at {dataset_path}")
        return records

    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line.strip())
                prompt = (
                    f"<|im_start|>system\n"
                    f"You are EDEN, the Educational AI companion of EduSphere. "
                    f"Provide verified, actionable academic and career guidance.<|im_end|>\n"
                    f"<|im_start|>user\n"
                    f"{item.get('instruction', '')}\n"
                    f"Context: {item.get('context', 'None')}<|im_end|>\n"
                    f"<|im_start|>assistant\n"
                    f"{item.get('response', '')}<|im_end|>"
                )
                records.append({"text": prompt})

    return records


def train():
    cfg = load_config()
    print("=" * 60)
    print("🚀 Starting EDEN AI Domain QLoRA Fine-Tuning")
    print(f"📦 Base Model: {cfg.get('base_model_name', 'google/gemma-2-2b-it')}")
    print(f"🎯 Output Directory: {cfg.get('output_dir', './eden_lora_adapter')}")
    print("=" * 60)

    # Check optional training dependencies dynamically
    required_packages = ["torch", "transformers", "peft", "trl", "bitsandbytes", "datasets"]
    missing_packages = []
    for pkg in required_packages:
        try:
            importlib.import_module(pkg)
        except ImportError:
            missing_packages.append(pkg)

    records = prepare_dataset_records(DATASET_PATH)
    print(f"📊 Loaded {len(records)} domain training samples from {DATASET_PATH.name}")

    if missing_packages:
        print("\n" + "─" * 60)
        print(f"ℹ️ Fine-tuning environment note: Missing packages: {', '.join(missing_packages)}")
        print("💡 To run GPU-accelerated QLoRA training on your machine / Colab, run:")
        print("   pip install torch transformers peft trl bitsandbytes datasets pyyaml accelerate")
        print("─" * 60)
        return

    # Dynamic execution when GPU fine-tuning environment is present
    torch = importlib.import_module("torch")
    transformers = importlib.import_module("transformers")
    peft = importlib.import_module("peft")
    trl = importlib.import_module("trl")
    datasets = importlib.import_module("datasets")

    # 1. 4-bit Quantization Config
    bnb_config = transformers.BitsAndBytesConfig(
        load_in_4bit=cfg.get("load_in_4bit", True),
        bnb_4bit_quant_type=cfg.get("bnb_4bit_quant_type", "nf4"),
        bnb_4bit_compute_dtype=getattr(torch, cfg.get("bnb_4bit_compute_dtype", "bfloat16")),
        bnb_4bit_use_double_quant=cfg.get("bnb_4bit_use_double_quant", True),
    )

    # 2. Tokenizer & Base Model Loading
    base_model = cfg.get("base_model_name", "google/gemma-2-2b-it")
    tokenizer = transformers.AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = transformers.AutoModelForCausalLM.from_pretrained(
        base_model,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = peft.prepare_model_for_kbit_training(model)

    # 3. LoRA Configuration
    peft_config = peft.LoraConfig(
        r=cfg.get("lora_r", 16),
        lora_alpha=cfg.get("lora_alpha", 32),
        lora_dropout=cfg.get("lora_dropout", 0.05),
        target_modules=cfg.get("target_modules", ["q_proj", "v_proj"]),
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = peft.get_peft_model(model, peft_config)

    # 4. Dataset Loading
    train_dataset = datasets.Dataset.from_list(records)

    # 5. Training Arguments
    training_args = transformers.TrainingArguments(
        output_dir=cfg.get("output_dir", "./eden_lora_adapter"),
        per_device_train_batch_size=cfg.get("per_device_train_batch_size", 4),
        gradient_accumulation_steps=cfg.get("gradient_accumulation_steps", 4),
        learning_rate=cfg.get("learning_rate", 0.0002),
        weight_decay=cfg.get("weight_decay", 0.01),
        num_train_epochs=cfg.get("num_train_epochs", 3),
        warmup_ratio=cfg.get("warmup_ratio", 0.05),
        lr_scheduler_type=cfg.get("lr_scheduler_type", "cosine"),
        logging_steps=cfg.get("logging_steps", 10),
        save_strategy=cfg.get("save_strategy", "epoch"),
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
    )

    # 6. SFT Trainer
    trainer = trl.SFTTrainer(
        model=model,
        train_dataset=train_dataset,
        dataset_text_field="text",
        max_seq_length=cfg.get("max_seq_length", 2048),
        tokenizer=tokenizer,
        args=training_args,
    )

    print("⚡ Commencing LoRA training epochs...")
    trainer.train()

    # 7. Save Adapter
    out_dir = cfg.get("output_dir", "./eden_lora_adapter")
    model.save_pretrained(out_dir)
    tokenizer.save_pretrained(out_dir)
    print(f"✅ EDEN LoRA Adapter saved successfully to: {out_dir}")


if __name__ == "__main__":
    train()
