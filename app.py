from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

# optional: prevent favicon requests from crashing if the file is missing
@app.route("/favicon.ico")
def favicon():
    return ("", 204)

@app.route("/health")
def health_check():
    return {"status": "healthy", "service": "px1rt"}, 200
