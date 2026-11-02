"""
Deploy the Streamlit dashboard (app.py) on Modal.

One-time setup:
    pip install modal
    modal setup                                  # log in from your browser
    modal secret create supabase-anon \
        SUPABASE_URL=https://<your-project>.supabase.co \
        SUPABASE_ANON_KEY=<anon public key>

Test it (temporary URL, stops when you press Ctrl+C):
    modal serve modal_app.py
Deploy it (permanent URL printed in the terminal):
    modal deploy modal_app.py
"""

import shlex
import subprocess
from pathlib import Path

import modal

LOCAL_APP = Path(__file__).parent / "app.py"
REMOTE_APP = "/root/app.py"
LOCAL_THEME = Path(__file__).parent / ".streamlit" / "config.toml"
REMOTE_THEME = "/root/.streamlit/config.toml"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("streamlit==1.66.1", "supabase~=2.10", "pandas~=2.2", "altair>=5.4", "python-dotenv")
    .add_local_file(LOCAL_APP, REMOTE_APP)
    .add_local_file(LOCAL_THEME, REMOTE_THEME)  # dashboard colors
)

app = modal.App(name="clueless-closet-d2-dashboard", image=image)


@app.function(secrets=[modal.Secret.from_name("supabase-anon")], scaledown_window=300)
@modal.concurrent(max_inputs=100)
@modal.web_server(8000, startup_timeout=60)
def run():
    cmd = (f"streamlit run {shlex.quote(REMOTE_APP)} --server.port 8000 "
           "--server.enableCORS=false --server.enableXsrfProtection=false --server.headless=true")
    subprocess.Popen(cmd, shell=True, cwd="/root")  # cwd so Streamlit finds .streamlit/config.toml
