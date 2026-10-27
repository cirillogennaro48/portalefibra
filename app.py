import requests, urllib3, os
from flask import Flask, render_template_string
urllib3.disable_warnings()
app = Flask(__name__)
BASE = "https://ws-of.sertori.it:8443/xmeweb-api/api"
USER = os.environ.get("SERTORI_USER", "SCALAMIA")
PWD = os.environ.get("SERTORI_PWD", "")
session = requests.Session()
def fetch_lavori():
    session.post(f"{BASE}/Login", json={"UserName": USER, "Password": PWD, "ConnectionType": "A", "Mob__os": "Windows"}, verify=False)
    r = session.get(f"{BASE}/App/XMEAuthorization/FP_LAVOR/FP_LAVOR_TELECOM", verify=False)
    return r.json()
HTML = """<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>Portale</title><style>body{font-family:Arial;padding:10px;background:#f5f5f5}table{width:100%;border-collapse:collapse;background:white;display:block;overflow-x:auto}th,td{padding:8px;border:1px solid #ddd;font-size:12px;white-space:nowrap}th{background:#111;color:#fff}input{padding:10px;width:95%;margin-bottom:10px}</style></head><body><h3>Lavori: {{count}}</h3><input id='q' placeholder='Cerca...' onkeyup='filter()'><table id='t'><tr>{% for c in cols %}<th>{{c}}</th>{% endfor %}</tr>{% for row in data %}<tr>{% for c in cols %}<td>{{row.get(c,'')}}</td>{% endfor %}</tr>{% endfor %}</table><script>function filter(){let v=document.getElementById('q').value.toLowerCase();document.querySelectorAll('#t tr').forEach((tr,i)=>{if(i==0)return;tr.style.display=tr.innerText.toLowerCase().includes(v)?'':'none';})}</script></body></html>"""
@app.route("/")
def index():
    try:
        data = fetch_lavori()
        cols = list(data[0].keys()) if data else []
        return render_template_string(HTML, data=data[:500], cols=cols, count=len(data))
    except Exception as e:
        return f"Errore: {e}"
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
