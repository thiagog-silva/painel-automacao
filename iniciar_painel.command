#!/bin/bash
# Duplo-clique neste arquivo (Mac) pra abrir o Painel de Automação.
# Ele sobe um servidor local só pra esta pasta e abre o navegador.
cd "$(dirname "$0")"
PORT=8790
( sleep 1 && open "http://127.0.0.1:$PORT/index.html" ) &
python3 -m http.server "$PORT" || python -m http.server "$PORT"
