# Painel de Automação — versão independente

Esta pasta é uma cópia completa do painel que roda dentro do Claude, mas
funcionando sozinha, sem precisar do Claude nem de internet (só a fonte
IBM Plex, que vem do Google Fonts, precisa de internet na primeira vez —
o resto funciona 100% offline).

## Como abrir

**É só dar duplo-clique no `index.html`.** Ele abre direto no navegador e
já funciona — não precisa instalar nada, nem servidor, nem internet (só a
fonte, que vem do Google Fonts, precisa de internet na primeira vez; se
não tiver, o painel usa a fonte padrão do sistema e continua funcionando
normal).

Se preferir (ou se `index.html` não abrir sozinho no seu computador,
alguns bloqueiam duplo-clique em HTML por padrão), tem dois atalhos
alternativos que sobem um servidor local só pra esta pasta:

- **Mac:** dê duplo-clique em `iniciar_painel.command`.
  - Se aparecer aviso de segurança na primeira vez, clique com o botão
    direito nele → Abrir → Abrir mesmo assim.
- **Windows:** dê duplo-clique em `iniciar_painel.bat`.
  - Precisa ter Python instalado. Em muitos computadores de empresa,
    scripts `.bat` são bloqueados pela política de segurança e a janela
    nem chega a abrir — nesse caso é só usar o `index.html` direto mesmo
    (funciona igual, sem precisar do script).

## O que tem aqui dentro

- `index.html` — a casca do painel (menu lateral, cards da Início).
- `tools/` — cada ferramenta, um arquivo `.html` independente.
- Os scripts `iniciar_painel.*` — só pra abrir o servidor local.

## Adicionar uma ferramenta nova

Duas formas:

1. **Pela interface** (mais rápido, mas fica só neste computador/navegador):
   na aba Início, clique em "Adicionar nova ferramenta", escolha o arquivo
   `.html` (gerado no padrão do "prompt de padrões do hub" — peça esse
   prompt pro Claude se ainda não tiver) e preencha nome/ícone/categoria.

2. **Editando os arquivos** (definitivo, funciona pra qualquer pessoa que
   usar esta pasta): salve o `.html` da ferramenta dentro de `tools/` e
   adicione um bloco no array `TOOLS`, perto do topo do `<script>` em
   `index.html` — o próprio arquivo tem instruções detalhadas em
   comentário logo ali.

## Downloads dentro das ferramentas

As ferramentas que geram arquivo pra baixar (planilha, txt etc.) usam o
mesmo mecanismo de download normal do navegador quando rodam fora do
Claude — não precisa de nada especial, só confirmar o download quando o
navegador perguntar.

## Atualizando esta pasta

Se você pedir pro Claude mudar alguma ferramenta ou adicionar uma nova no
painel principal (dentro do Claude), é só pedir pra ele também gerar uma
cópia atualizada desta pasta exportada.

## Atualizar online

O painel publicado fica em **https://thiagog-silva.github.io/painel-automacao/**
e o código em **https://github.com/thiagog-silva/painel-automacao**.
Toda vez que um arquivo do repositório muda, o GitHub republica o site
sozinho em cerca de 1 minuto (aba **Actions** mostra o andamento).

### Caminho mais simples (sem instalar nada)

1. Abra **github.com > seu repositório `painel-automacao`**.
2. Entre na pasta **`tools`** (para trocar ou incluir uma ferramenta) —
   para mudar o `index.html`, fique na raiz.
3. Clique em **Add file > Upload files**, arraste o `.html` novo/atualizado
   (mesmo nome do arquivo antigo substitui o antigo).
4. Role até o fim e clique em **Commit changes**.
5. Espere cerca de 1 minuto e recarregue o site (Ctrl+F5).

Se for uma ferramenta **nova**, lembre de acrescentar o bloco dela no array
`TOOLS` do `index.html` (veja "Adicionar uma ferramenta nova" acima) — em
github.com, abra `index.html`, clique no lápis (Edit), altere e faça o Commit.

### Alternativa pelo computador (git)

Dentro da pasta do repositório no seu computador (a pasta `painel-automacao`):

```
git add .
git commit -m "Atualiza ferramentas"
git push
```

### Importante

- Nunca suba planilhas, relatórios ou PDFs de clientes: o `.gitignore`
  bloqueia `.xlsx .xls .xlsm .csv .pdf .txt .zip .ofx` para evitar acidentes,
  mas pelo site (Upload files) esse bloqueio não vale — confira o que está
  arrastando. O repositório e o site são públicos.
- Os arquivos que você processa nas ferramentas ficam só no seu navegador;
  nada é enviado a servidor.
