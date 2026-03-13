# `/patterns`ページの市松模様の色選択アルゴリズムの改良案

## 抱えている問題

現在の`app/src/routes/patterns/+page.svelte`では、各テーマのベース・アソートカラーをサジェスト（`app/src/lib/patterns/themes.ts`で定義されたルール）からランダム選択し、市松模様として表示している。

この完全ランダムな方式には、次のような問題がある。

- ベースカラーとアソートカラーで同じ色を選んでしまい、市松模様が単色になる場合がある
- サジェスト内だとしても、そのテーマのイメージが伝わりづらい色の組み合わせもある

このページの市松模様は各配色テーマの特徴を顕著に伝えるためのものなので、上記の問題を解消したい。

## 改善案

`app/src/routes/patterns/+page.svelte`の市松模様に使う専用の、イメージを表現するにあたってより効果的な（制限の強い）サジェストルールを定義する。

```js
[
  {
    id: "elegant",
    effectiveRules: {
      base: {
        suggestedHues: [20, 21, 22, 23],
        suggestedTones: ["ltg"]
      },
      assort: {
        suggestedHues: [24, 1],
        suggestedTones: ["lt"]
      }
    }
  },
  {
    id: "casual",
    effectiveRules: {
      base: {
        suggestedHues: [4,5,6],
        suggestedTones: ["lt"]
      },
      assort: {
        suggestedHues: [10,11,12,13,14,15,16,17,18],
        suggestedTones: ["b"]
      }
    }
  },
  {
    id: "classic",
    effectiveRules: {
      base: {
        suggestedHues: [1,2,3,4,5,6],
        suggestedTones: ["dk", "dkg"],
      },
      assort: {
        suggestedHues: [11,12,13,14,15,16],
        suggestedTones: ["dp"]
      }
    }
  },
  {
    id: "clear",
    effectiveRules: {
      base: {
        suggestedHues: [14,15,16,17,18,19],
        suggestedTones: ["lt", "p"],
      },
      assort: {
        suggestedHues: [],
        suggestedTones: ["W"]
      }
    }
  },
  {
    id: "chic",
    effectiveRules: {
      base: {
        suggestedHues: [],
        suggestedTones: ["dkGy"],
      },
      assort: {
        suggestedHues: [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        suggestedTones: ["g", "dk"]
      }
    }
  },
  {
    id: "dynamic",
    effectiveRules: {
      base: {
        suggestedHues: [],
        suggestedTones: ["Bk"],
      },
      assort: {
        suggestedHues: [2, 5, 8, 12, 18],
        suggestedTones: ["b", "s", "v"],
      }
    }
  },
  {
    id: "warm-natural",
    effectiveRules: {
      base: {
        suggestedHues: [4,5,6,7],
        suggestedTones: ["sf", "d"]
      },
      assort: {
        suggestedHues: [10,11,12],
        suggestedTones: ["ltg", "sf", "d"]
      }
    }
  },
  {
    id: "fresh-natural",
    effectiveRules: {
      base: {
        suggestedHues: [9, 10, 11, 12, 13, 14, 15, 16],
        suggestedTones: ["lt", "p"]
      },
      assort: {
        suggestedHues: [],
        suggestedTones: ["W"]
      }
    }
  },
  {
    id: "modern",
    effectiveRules: {
      base: {
        suggestedHues: [],
        suggestedTones: ["ltGy"],
      },
      assort: {
        suggestedHues: [16, 17, 18],
        suggestedTones: ["d", "s", "v"]
      }
    }
  },
  {
    id: "romantic",
    effectiveRules: {
      base: {
        suggestedHues: [24,1],
        suggestedTones: ["p"]
      },
      assort: {
        suggestedHues: [3,4],
        suggestedTones: ["lt"]
      }
    }
  }
]
```
