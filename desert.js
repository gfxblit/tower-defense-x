const waves = [
  [{ enemy: 'normal', amount: 4 }],
  [{ enemy: 'normal', amount: 7 }],
  [{ enemy: 'speedy', amount: 4 }],
  [{ enemy: 'normal', amount: 4 },
   { enemy: 'speedy', amount: 3}],
  [{ enemy: 'slow', amount: 6}],
  [{ enemy: 'slow', amount: 8}, { enemy: 'normal', amount: 4 }, { enemy: 'speedy', amount: 4}],
  [{ enemy: 'normal', amount: 8}, { enemy: 'normalBoss', amount: 1}],
  [{ enemy: 'normal', amount: 4}, { enemy: 'slow', amount: 4 }, { enemy: 'normalBoss', amount: 1}],
  [{ enemy: 'hidden', amount: 8}],
  [{ enemy: 'slow', amount: 5}, { enemy: 'normalBoss', amount: 2}],
  [{ enemy: 'normalBoss', amount: 5},
   { enemy: 'slow', amount: 150},
   {enemy: 'normal', amount: 500}]
]

const enemyTypes = {
    normal: {
      health: 4,
      speed: 'average',
      textureId: 'zoimbie1_hold.png'
    },
    speedy: {
      health: 3,
      speed: 'fast',
      textureId: 'manBlue_hold.png'
    },
    slow: {
      health: 8,
      speed: 'slow',
      textureId: 'manOld_hold.png'
    },
    normalBoss: {
      health: 160,
      speed: 'belowAverage',
      textureId: 'zoimbie1_hold.png',
      scale: 1.5
    },
    hidden: {
      health: 10,
      speed: 'aboveAverage',
      toHitTags: ['hidden'],
      textureId: 'robot1_hold.png',
      tint: 0x333333,
    },
    mystery: {
      health: 10,
      speed: 'aboveAverage',
      textureId: 'womanGreen_hold.png',
    },
  }

export const speeds = {
  slow: 100*4,
  belowAverage: 150*4,
  average: 200*4,
  aboveAverage: 250*4,
  fast: 400*4
}

export function getEnemyTypes() {
  const expandedEnemyTypes = {}
  for (let prop in enemyTypes) {
    const enemyType = enemyTypes[prop]
    const expandedEnemyType = {}

    for (let innerProp in enemyType) {
      expandedEnemyType[innerProp] = enemyType[innerProp]
      if (innerProp == 'speed') {
        // substitute speed class with actual speed
        expandedEnemyType.speed = speeds[enemyType.speed]
      }
      expandedEnemyTypes[prop] = expandedEnemyType
    }
  }

  return expandedEnemyTypes
}

export function getWaves() {
  const expandedWaves = []

  for (let w = 0; w < waves.length; w++) {
    const expandedWave = []
    // example compressedUnit = { enemy: 'normal', amount: 2}
    // will expand to ['normal', 'normal']
    waves[w].forEach(compressedUnit => {
      for (let j = 0; j < compressedUnit.amount; ++j) {
        expandedWave.push(compressedUnit.enemy)
      }
    })

    expandedWaves.push(expandedWave)
  }

  return expandedWaves
}

export const towerTypes = {
  soldier: {
    damage: 1,
    range: 10*20,
    cost: 375,
    firePeriodMs: 200,
    textureId: 'soldier1_gun.png',
    fireSound: { name: 'm4a1' },
    burstCount: 3,
    cooldownPeriodMs: 1200,
    upgrades: [
      { cost: 100, upgrade: {range: 240 }},
      { cost: 300, upgrade: {range: 260, canHitTags: ['hidden']}},
      { cost: 1400, upgrade: {range: 280, damage: 2, firePeriodMs: 150, burstCount: 4, cooldownPeriodMs: 850 }},
      { cost: 5500, upgrade: {range: 300, damage: 5, burstCount: 5}},
    ]
  },
  demoman: {
    damage: 2,
    range: 7*20,
    cost: 450,
    firePeriodMs: 3000,
    textureId: 'manBrown_gun.png',
    fireSound: { name: 'm79' },
    burstCount: 1,
    cooldownPeriodMs: 0,
    projectileSpeed: 200*5,
    splashRange: 3*20,
    upgrades: [
      { cost: 100, upgrade: { range: 10*20 }},
      { cost: 400, upgrade: { range: 12*20, damage: 5 }},
      { cost: 1000, upgrade: { damage: 7, firePeriodMs: 2000, }},
      { cost: 3500, upgrade: { range: 14*20, firePeriodMs: 1800, damage: 20, splashRange: 6*20 }},
    ]
  },
  minigunner: {
    damage: 1,
    range: 16 * 20,
    cost: 2000,
    firePeriodMs: 140,
    textureId: 'robot1_machine.png',
    burstCount: 999999,
    revUpSound: { name: 'minigun', marker: { name: 'revUp', start: 0, duration: 1.1, config: { volume: 0.02 }}},
    cooldownSound: { name: 'minigun', marker: { name: 'cooldown', start: 3.0, duration: 1.0, config: { volume: 0.02 }}},
    fireSound: { name: 'minigun', marker: { name: 'fire', start: 1, duration: 0.2, config: { volume: 0.02 }}},
    cooldownPeriodMs: 1000,
    revUpPeriodMs: 500,
    upgrades: []
  }
}