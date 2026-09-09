"""
EDEN LoRA to Ollama Exporter
EduSphere AI-Powered Student Lifecycle Management Ecosystem

Merges trained EDEN LoRA adapter with base model and packages it into an Ollama model.
"""

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODELFILE_PATH = BASE_DIR / "Modelfile.eden"
ADAPTER_DIR = BASE_DIR / "eden_lora_adapter"


def export_ollama(model_name: str = "eden:latest"):
    print("=" * 60)
    print(f"📦 Exporting EDEN Domain Model to Ollama: {model_name}")
    print(f"📄 Modelfile: {MODELFILE_PATH}")
    print("=" * 60)

    if not MODELFILE_PATH.exists():
        print(f"❌ Error: Modelfile not found at {MODELFILE_PATH}")
        sys.exit(1)

    cmd = ["ollama", "create", model_name, "-f", str(MODELFILE_PATH)]
    print(f"🚀 Executing: {' '.join(cmd)}")

    try:
        res = subprocess.run(cmd, check=True, text=True, capture_output=True)
        print(res.stdout)
        print(f"✅ EDEN Model successfully created in Ollama as '{model_name}'!")
        print("💡 You can now run: ollama run eden:latest")
    except FileNotFoundError:
        print("⚠️ Ollama executable not detected in system PATH.")
        print("📥 Please install Ollama from https://ollama.com and run:")
        print(f"   ollama create {model_name} -f {MODELFILE_PATH}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Ollama creation failed: {e.stderr}")


if __name__ == "__main__":
    export_ollama()
