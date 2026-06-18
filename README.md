# Rafael Nassif — Portfólio

**🔗 No ar:** https://rafaelnassif.com.br

Landing page de portfólio (one-page) para Rafael Nassif Crestani, UX/UI & Product
Designer. Dark editorial com estética de *blueprint de design system*, animações GSAP
e campo de partículas interativo em Three.js.

## Como rodar

É um site estático — qualquer servidor resolve:

```bash
# na pasta do projeto
python -m http.server 4173
# abra http://localhost:4173
```

> Abrir o `index.html` com duplo clique também funciona, mas o navegador bloqueia
> ES modules em `file://` — a página inteira funciona, só as partículas Three.js
> ficam de fora. Prefira um servidor local.

## Animações × acessibilidade

**As animações ficam ligadas por padrão para todos os visitantes.** O hint
`prefers-reduced-motion` do sistema não é usado como gate, porque no Windows ele é
ativado por perfis de desempenho (Efeitos de animação desligados) sem o usuário
perceber — e silenciaria o portfólio justamente para parte do público.

Quem precisar da versão estática (tudo visível, zero movimento) tem opt-out explícito:

```
http://localhost:4173/?motion=off
```

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `index.html` | Conteúdo e estrutura (PT-BR), fontes, CDNs |
| `css/styles.css` | Design system da página (tokens, tipografia fluida, arte CSS dos cases, responsivo) |
| `js/main.js` | GSAP: preloader, split text, reveals, Lenis, cursor, magnetic, tilt, menu, relógio |
| `js/scene.js` | Three.js: partículas com ondas em shader + ripple do mouse |
| `docs/specs/` | Design doc da página |

## Stack

- [GSAP 3](https://gsap.com) + ScrollTrigger (CDN)
- [Lenis](https://lenis.darkroom.engineering/) smooth scroll (CDN)
- [Three.js](https://threejs.org) r160 via import map (CDN)
- Fontes: Archivo (variável, largura 62–125) + Fragment Mono (Google Fonts)

## Degradação graciosa

- Sem WebGL → hero mantém composição em CSS (glow + grain).
- CDN do GSAP bloqueado → conteúdo todo visível, sem animações.
- `prefers-reduced-motion` → versão estática completa, partículas em frame único.
- Touch → cursor custom, tilt e magnetic desativados; partículas em modo ambiente.

## Conteúdo

Para editar textos (experiências, cases, skills), tudo está direto no `index.html`,
seção por seção, com comentários `<!-- ============ -->` demarcando cada bloco.
