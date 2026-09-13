export const REWARDS = { easy: 10, normal: 15, nightmare: 20 };
export const BASES = { player: { x: 125, y: 225 }, enemy: { x: 875, y: 225 }, ally: { x: 500, y: 445 } };
export const ITEMS = [
  { id: 'king', title: '国王升级', icon: '♛', desc: '每升一级，开局多一名守卫。最高 5 级，国王始终保持 5 条命。', price: 150, type: 'king' },
  { id: 'archer', title: '弓箭手', icon: '➶', desc: '解锁后每次答对，召唤一名近战兵和一名远程弓箭手。', price: 180, type: 'unlock' },
  { id: 'heal', title: '春风治疗', icon: '✚', desc: '立即为所有我方小兵恢复生命。冷却 25 秒，不恢复国王生命。', price: 120, type: 'unlock' },
  { id: 'shield', title: '守护结界', icon: '◇', desc: '保护自己的国王 8 秒，期间不掉命。冷却 35 秒。', price: 150, type: 'unlock' },
  { id: 'fox', title: '伙伴 · 小赤狐', icon: '🦊', desc: '所有我方小兵攻击力提升 10%。最多携带一只宠物。', price: 200, type: 'pet' },
  { id: 'turtle', title: '伙伴 · 小青龟', icon: '🐢', desc: '所有我方小兵生命值提升 15%。最多携带一只宠物。', price: 200, type: 'pet' },
  { id: 'sun', title: '日光王国', icon: '☀', desc: '暖金色城堡与旗帜。只改变外观，不增加战斗能力。', price: 100, type: 'skin' },
  { id: 'violet', title: '紫星王国', icon: '✧', desc: '紫罗兰色城堡与旗帜。只改变外观，不增加战斗能力。', price: 100, type: 'skin' },
  { id: 'default', title: '翡翠王国', icon: '♜', desc: '草原上的第一面旗帜。最初的勇气，永远闪耀。', price: 0, type: 'skin' }
];
export function newProfile(name = '小小勇士') {
  return { id: globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random(), name, balance: 0, total: 0, beans: 0, bosses: 0, king: 1, owned: ['default'], skin: 'default', pet: null, stages: {}, correct: 0, answered: 0, wins: 0, mistakes: [], settings: { grade: '1', semester: '1', subject: 'math', difficulty: 'easy' } };
}
export function courseKey(settings) { return [settings.grade, settings.semester, settings.subject, settings.difficulty].join('-'); }
export function buy(profile, id) {
  const item = ITEMS.find(i => i.id === id);
  if (!item) return false;
  if (item.type === 'king' && profile.king >= 5) return false;
  const owned = profile.owned.includes(id);
  const price = item.type === 'king' ? item.price * profile.king : owned ? 0 : item.price;
  if (profile.balance < price) return false;
  profile.balance -= price;
  if (item.type === 'king') profile.king++;
  else if (!owned) profile.owned.push(id);
  if (item.type === 'pet') profile.pet = profile.pet === id ? null : id;
  if (item.type === 'skin') profile.skin = id;
  return true;
}
export function bossReward(profile) {
  profile.bosses++;
  if (profile.bosses % 2 === 0) { profile.beans++; return true; }
  return false;
}
export class Battle {
  constructor({ stage = 1, king = 1, pet = null, archer = false, random = Math.random } = {}) {
    Object.assign(this, { stage, pet, archer, random, time: 0, preparation: 8, units: [], effects: [], events: [], sequence: 0, ended: null, alliance: false, allyHostile: false, truceUntil: 0, shieldUntil: 0, enemyTimer: 0, allyTimer: 0, healReady: 0, shieldReady: 0, ultimateReady: 0 });
    this.kings = Object.fromEntries(Object.entries(BASES).map(([id, pos]) => [id, { ...pos, lives: 5, immuneUntil: 0 }]));
    this.bossOutcome = stage % 3 === 0 ? 'alive' : null;
    this.spawn('player', 2 + king); this.spawn('enemy', 3); this.spawn('ally', 3, 'ally');
    if (stage % 3 === 0) this.spawn('enemy', 1, 'player', 'boss');
  }
  spawn(side, count = 1, target = side === 'player' || side === 'ally' ? 'enemy' : 'player', kind = 'soldier') {
    if (this.kings[side].lives <= 0) return;
    for (let i = 0; i < count; i++) {
      const isArcher = side === 'player' && this.archer && i % 2 === 1 && kind === 'soldier';
      const type = isArcher ? 'archer' : kind;
      const hp = (kind === 'boss' ? 175 + Math.min(this.stage, 20) * 5 : 32) * (side === 'player' && this.pet === 'turtle' ? 1.15 : 1);
      this.units.push({ id: ++this.sequence, side, target, type, x: BASES[side].x + (this.random() - .5) * 34, y: BASES[side].y + (this.random() - .5) * 38, hp, maxHp: hp, attack: (kind === 'boss' ? 17 : 9) * (side === 'player' && this.pet === 'fox' ? 1.1 : 1), speed: kind === 'boss' ? 16 : 29, range: isArcher ? 110 : kind === 'boss' ? 33 : 23, cooldown: this.random() * .5 });
    }
  }
  hostile(a, b) {
    if (a === b) return false;
    if ([a, b].includes('ally')) {
      if ([a, b].includes('player')) return this.allyHostile && !this.alliance && this.time >= this.truceUntil;
      return this.alliance || this.allyHostile;
    }
    return true;
  }
  setAlliance(on) {
    if (this.kings.ally.lives <= 0 || this.ended) return false;
    this.alliance = on; this.allyHostile = false;
    this.truceUntil = this.time + 10;
    this.units.forEach(u => {
      if (u.side === 'ally') u.target = on ? 'enemy' : 'ally';
      if (u.side === 'player' && u.target === 'ally') u.target = on ? 'enemy' : 'player';
      if (u.side === 'enemy' && u.target === 'ally' && !on) u.target = 'player';
    });
    this.events.push({ type: 'log', text: on ? '盟约生效！蓝湾小兵开始协助出战。' : '联盟已解除，支援部队返回本国，双方休战 10 秒。' });
    return true;
  }
  support() {
    if (!this.alliance || this.kings.ally.lives <= 0 || this.ended) return 0;
    const selected = this.units.filter(u => u.side === 'player' && u.hp > 0 && u.target !== 'ally').sort((a,b) => a.x-b.x).slice(0, 2);
    selected.forEach(u => u.target = 'ally');
    return selected.length;
  }
  attackAlly() {
    if (this.alliance || this.time < this.truceUntil || this.kings.ally.lives <= 0 || this.ended) return false;
    this.allyHostile = true;
    this.units.filter(u => u.side === 'player').slice(0, 3).forEach(u => u.target = 'ally');
    this.units.filter(u => u.side === 'ally').forEach(u => u.target = 'player');
    return true;
  }
  heal() {
    if (this.time < this.healReady || this.ended) return false;
    this.units.filter(u => u.side === 'player').forEach(u => u.hp = u.maxHp);
    this.healReady = this.time + 25; this.effects.push({ x:125, y:225, type:'heal', life:1 }); return true;
  }
  shield() {
    if (this.time < this.shieldReady || this.ended) return false;
    this.shieldUntil = this.time + 8; this.shieldReady = this.time + 35; return true;
  }
  ultimate() {
    if (this.time < this.ultimateReady || this.ended) return false;
    this.units.filter(u => this.hostile('player', u.side)).forEach(u => { u.hp -= 110; this.effects.push({x:u.x,y:u.y,type:'star',life:1}); });
    this.ultimateReady = this.time + 3; this.removeDefeated(); return true;
  }
  removeDefeated() {
    this.units.filter(u => u.hp <= 0).forEach(u => { if (u.type === 'boss' && !u.breached) { this.bossOutcome = 'defeated'; this.events.push({ type: 'boss' }); } this.effects.push({ x:u.x,y:u.y,type:'puff',life:.6 }); });
    this.units = this.units.filter(u => u.hp > 0);
  }
  hitKing(side, unit) {
    const king = this.kings[side];
    if (king.lives <= 0 || this.time < king.immuneUntil || (side === 'player' && this.time < this.shieldUntil)) return;
    king.lives--; king.immuneUntil = this.time + 3;
    unit.hp = 0;
    unit.breached = true;
    if (unit.type === 'boss') this.bossOutcome = 'escaped';
    this.effects.push({x:king.x,y:king.y,type:'hit',life:.7});
    this.events.push({ type:'life', side, lives:king.lives });
    if (king.lives > 0) this.spawn(side, 1, side === 'ally' ? (this.allyHostile ? 'player' : this.alliance ? 'enemy' : 'ally') : undefined);
    else if (side === 'player' || side === 'enemy') this.ended = side === 'enemy' ? 'win' : 'loss';
    else { this.alliance = false; this.allyHostile = false; this.units.filter(u => u.side === 'ally').forEach(u => u.hp = 0); this.units.filter(u => u.target === 'ally').forEach(u => u.target = u.side === 'player' ? 'enemy' : 'player'); }
  }
  tick(dt) {
    if (this.ended) return;
    dt = Math.min(.1, Math.max(0, dt)); this.time += dt;
    this.effects.forEach(e => e.life -= dt); this.effects = this.effects.filter(e => e.life > 0);
    if (this.time < this.preparation) return;
    this.enemyTimer += dt; this.allyTimer += dt;
    if (this.enemyTimer >= Math.max(6.5, 11 - this.stage * .15)) { this.enemyTimer = 0; this.spawn('enemy', this.stage >= 8 ? 2 : 1, this.alliance && this.kings.ally.lives > 0 && this.random() < .3 ? 'ally' : 'player'); }
    if (this.allyTimer >= 18) { this.allyTimer = 0; if (this.alliance || this.allyHostile) this.spawn('ally', 1, this.alliance ? 'enemy' : 'player'); }
    for (const u of [...this.units]) {
      if (u.hp <= 0 || this.ended) continue;
      u.cooldown -= dt;
      let nearest = null, distance = Infinity;
      for (const other of this.units) {
        if (other.hp <= 0 || !this.hostile(u.side, other.side)) continue;
        const d = Math.hypot(u.x - other.x, u.y - other.y);
        if (d < distance) { distance = d; nearest = other; }
      }
      if (nearest && distance <= u.range) {
        if (u.cooldown <= 0) { nearest.hp -= u.attack; u.cooldown = u.type === 'archer' ? 1.15 : .95; this.effects.push({ x:nearest.x,y:nearest.y,type:u.type === 'archer'?'arrow':'hit',life:.2 }); }
        continue;
      }
      const base = this.kings[u.target];
      const target = nearest && distance < 105 ? nearest : base;
      const d = Math.hypot(target.x - u.x, target.y - u.y);
      if (target === base && d < 30) {
        if (this.hostile(u.side, u.target)) this.hitKing(u.target, u);
        // After returning from a cancelled alliance, rejoin the main front.
        else if (u.side === 'player' && u.target === 'player') u.target = 'enemy';
      } else if (d > 8) { u.x += (target.x-u.x)/d*u.speed*dt; u.y += (target.y-u.y)/d*u.speed*dt; }
    }
    this.removeDefeated();
  }
}

