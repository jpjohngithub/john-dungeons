# 🗺️ John Dungeons — Roadmap de Implementação

## Fase 0: Fundação (Semanas 1-2)
- [x] Arquitetura de pastas e módulos
- [x] Core: Engine, EventBus, ObjectPool, ComponentSystem
- [x] Scaffolding: index.html, Vite, package.json
- [ ] Importar/criar assets placeholder (cubos, esferas low-poly)
- [ ] Setup de CI/CD (Vite build + deploy preview)

## Fase 1: Vertical Slice (Semanas 3-6)
> **Meta: 1 jogador rodando em 1 bioma com 3 armas e 1 habilidade**

### Renderização
- [ ] StylizedPBR Material + Cel-Shading no personagem e terreno
- [ ] Outline Pass funcionando
- [ ] Ciclo Dia/Noite básico (sol rotaciona, cores mudam)
- [ ] Post-processing: Bloom + Color Grading

### Jogador
- [ ] PlayerController: IDLE, WALK, SPRINT, FALL, JUMP
- [ ] CameraController: Spring Arm com colisão
- [ ] InputManager: Teclado + Mouse
- [ ] IK de pés no terreno

### Combate
- [ ] 1 arma Hitscan (Assault Rifle) + 1 Projétil (Rocket Launcher)
- [ ] Dano: escudo → vida, hitmarkers, camera shake
- [ ] Recuo procedural básico
- [ ] Damage numbers flutuantes

### GAS
- [ ] AttributeSet com HP, Shield, Stamina
- [ ] 1 GameplayEffect (Regen)
- [ ] 1 Habilidade (Fireball)

### IA
- [ ] 1 Bot com BT simples: patrulhar → detectar → atirar
- [ ] Pathfinding básico (navmesh ou waypoints)

## Fase 2: Alpha — Core Loop (Semanas 7-12)
> **Meta: Partida BR completa com 20 bots, 3 biomas, crafting e classes**

### Battle Royale
- [ ] StormManager multi-fase completo
- [ ] DropSystem: queda livre + planador
- [ ] LootManager: spawn de armas/itens com raridades
- [ ] 3 biomas: Grassland, Snow, Desert

### RPG
- [ ] 3 Classes: Assault, Scout, Technomancer
- [ ] TalentTree: 3 branches × 5 tiers
- [ ] ProgressionManager: XP por kills, crafting, exploração
- [ ] ElementalSystem: reações Fire+Ice, Fire+Lightning, Ice+Lightning

### Sobrevivência
- [ ] StatusManager: Fome + Temperatura
- [ ] ResourceGathering: árvores, pedras, caixas
- [ ] CraftingSystem: 10 receitas básicas
- [ ] BuildingSystem: wall, barricade, campfire
- [ ] InventorySystem: 24 slots + equipamento

### IA Avançada
- [ ] BT completo: heal, flank, cover, rotate to zone
- [ ] EQS: find cover, find flank position
- [ ] 3 dificuldades: Easy, Medium, Hard

### Áudio
- [ ] AudioManager com Web Audio API espacial
- [ ] Footsteps por superfície
- [ ] Sons de armas, habilidades, UI

## Fase 3: Beta — Polimento (Semanas 13-18)
> **Meta: Experiência completa polida, pronta para playtest**

### Visual
- [ ] VFX completo: muzzle flash, trails, explosões, auras
- [ ] Neblina volumétrica estilizada
- [ ] Outline dinâmico (espessura por distância)
- [ ] Subsurface scattering na folhagem
- [ ] Partículas de ambiente (poeira, neve, cinzas)

### UI/UX
- [ ] HUD completo: HP, shield, ammo, minimap, compass
- [ ] RadialMenu para itens/crafting
- [ ] InventoryUI com drag & drop
- [ ] Kill feed
- [ ] Tela de vitória/derrota

### Game Feel
- [ ] Hitstop calibrado
- [ ] Camera shake por tipo de dano
- [ ] Hitmarkers sonoros diferenciados (escudo/vida/crit)
- [ ] Screen effects (dano, cura, zone)
- [ ] Slide + Mantle + arma com IK de mãos

### Áudio Avançado
- [ ] AdaptiveMusic: exploration ↔ combat ↔ final zone
- [ ] Oclusão de som por paredes
- [ ] Reverb por ambiente (caverna, exterior)

### Performance
- [ ] GPU Instancing para vegetação
- [ ] LOD para props e terreno
- [ ] Object Pooling auditado (zero alocações em runtime)
- [ ] Frustum culling agressivo
- [ ] Target: 120+ FPS em GPU mid-range

## Fase 4: Multiplayer Prep (Semanas 19-24)
> **Meta: Arquitetura pronta para 100 jogadores simultâneos**

- [ ] NetworkManager: WebSocket + protocolo binário
- [ ] Server authoritative: validação de movimento e dano
- [ ] Client-side prediction + reconciliation
- [ ] Lag compensation (server rewind)
- [ ] Entity interpolation para outros jogadores
- [ ] Lobby + matchmaking básico
- [ ] Anti-cheat básico (server-side validation)

## Fase 5: Content & Live (Semanas 25+)
- [ ] +6 biomas restantes
- [ ] +20 armas
- [ ] +12 habilidades (4 por elemento)
- [ ] Battle Pass / progression meta
- [ ] Seasonal map changes
- [ ] Leaderboards
- [ ] Replay system
- [ ] Spectator mode

---

## KPIs por Fase

| Fase | FPS Target | Entidades | Bots | Biomas | Armas | Habilidades |
|------|-----------|-----------|------|--------|-------|-------------|
| Vertical Slice | 60+ | 50 | 1 | 1 | 3 | 1 |
| Alpha | 90+ | 200 | 20 | 3 | 8 | 6 |
| Beta | 120+ | 500 | 50 | 4 | 12 | 9 |
| Multiplayer | 120+ | 1000 | 100 | 6 | 15 | 12 |
