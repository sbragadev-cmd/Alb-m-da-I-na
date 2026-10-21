ÁLBUM DA IÚNA — SITE INDEPENDENTE
=================================

Arquivos:
  index.html                página inicial
  nascimento.html           contagem regressiva
  assets/css/site.css       visual responsivo
  assets/js/site.js         animações, fotos e contador
  data/album.json           configuração e catálogo

PUBLICAÇÃO NA VERCEL:
- Framework Preset: Other
- Build Command: vazio
- Output Directory: raiz do projeto
- Não é obrigatório instalar Parcel para esta versão estática.

ABERTURA:
- Sorteia um efeito do nome "Iúna" a cada acesso.
- O efeito anterior é evitado no acesso seguinte.
- O visitante pode pular a animação.
- Respeita preferência por movimento reduzido.

FOTOS:
O catálogo está em data/album.json. Adicione fotos já publicadas
com URLs HTTPS ou caminhos locais. Exemplo:
{
  "album": "ultrassons",
  "title": "Primeiro ultrassom",
  "caption": "Uma lembrança especial",
  "alt": "Imagem do ultrassom",
  "src": "https://URL-PUBLICA-DA-MINIATURA",
  "published": true
}
Álbuns reconhecidos: ultrassons, cha, familia, amigos.
A página mostra as duas primeiras fotos de cada seção.
Fotos ainda não cadastradas exibem molduras elegantes.

GOOGLE DRIVE E GOOGLE APPS SCRIPT:
Este pacote é a interface inicial. Para conexão real:
1) Publicar um endpoint de leitura seguro pelo Apps Script.
2) Preferir URLs de miniaturas otimizadas em uma origem permitida.
3) Manter os originais no Google Drive, não no GitHub.
4) Configurar upload com autorização e eventual processo de aprovação.
Não publique credenciais, tokens nem links privados no frontend.
Limites de upload grandes dependem da implementação Google Drive API.

CONTAGEM REGRESSIVA:
Edite data/album.json:
  "expectedBirthDate": "AAAA-MM-DD"
Data deve ser a previsão informada pela família. Sem data, a página
mostra uma mensagem gentil em vez de um contador inventado.

EVENTOS:
As datas de Bagé e Porto Alegre vieram da organização anterior
do Chá da Iúna. Se necessário, revise no index.html.

Este pacote não altera o projeto original do Chá da Iúna.
