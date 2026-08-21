# 記法整備タスクリスト（CG記事）

各CG記事の数式・インラインコードの記法が `writing-guides/math-notation-guide.md` に沿っているかのチェックリスト。
整備は `/format-math-notation #<id>`（カンマ区切りで複数指定可。slug との混在も可）で行う。詳細はスキル `format-math-notation` を参照。

- チェック済み `[x]` … `/format-math-notation` を実行済み（自動修正の収束と advisory の指摘の判断まで済んでいる）
- 未チェック `[ ]` … まだ実行していない
- `[draft]` … ページは作成済みだが `draft: true`
- `[ページ未作成]` … まだページが存在しない下書き（YAML の `CgDraftLink`）
- 未作成のものも YAML 上の並び順を保つため一覧に混ぜて掲載する（チェックボックスは付けない）。
- **`[x]` は `format-math-notation` が実行の最後に書く手記録。** OGP・文体解析のタスクリストと同じ扱いで、`node scripts/sync-tasklists.mjs --write` は `[x]` を生成も削除もしない（直すのは並び順・行の過不足・`[draft]` の付け替えだけ）。
- **下書きの段階で実行した記事は `[draft]` ではなく `[x]` にする。** `sync-tasklists.mjs` は「`draft: true` なのに `[x]`」を警告するだけで書き換えないので、記録は残る。
- **公開時ゲート（`publish-article` 手順0.5）の `format-math-notation --auto` はチェックを付けない。** `--auto` は自動修正だけを当てて advisory の判断をしないため、実行済みには数えない。公開しても `[ ]` のまま残り、あとから手動で回す対象になる。
- ベースライン（`app/.textlintignore`）は別系統の記録で、CG記事は全件解消済み。`[x]` なのにベースラインに載っている記事は `sync-tasklists.mjs` が矛盾として警告する。
- 対象はCG記事（`app/src/routes/cg/**`）のみ。色の理論・色の活用分野は記法強制化のスコープ外なので載せない。
- 対象は解説記事（`layout: guide-content` の `+page.svx`）のみ。ユニット一覧ページは載せない。
- セクション見出しの `#<id>` が、そのままスキルへ渡せるスコープ指定。YAML の `sections[].id`（セクション）単位。
- 各セクション内の並びはコンテンツ YAML の並び順に忠実に従う。
- **並び順や行の過不足は手で直さない。** `node scripts/sync-tasklists.mjs --write` で YAML に追随させる。
- CG のセクション id はユニットをまたいで重複することがある（`#basics`＝画像符号化／パターン認識、`#special-effects`＝空間フィルタリング／画素ごとの濃淡・色変換）。指定するときはユニット名も添える。

---

## 画像からの3次元復元／画像と空間の幾何（`cg/3d-reconstruction.yaml` #geometry）

- [ページ未作成] 透視投影モデルと幾何学的関係
- [ページ未作成] 同次座標を用いた記述
- [ページ未作成] エピポーラ幾何

## 画像からの3次元復元／カメラキャリブレーションとステレオ（`cg/3d-reconstruction.yaml` #calibration-stereo）

- [ページ未作成] カメラキャリブレーション
- [ページ未作成] 空間位置の計算
- [ページ未作成] 平行ステレオ
- [ページ未作成] ステレオマッチング
- [ページ未作成] マルチビューステレオ
- [ページ未作成] アクティブステレオ

## 画像からの3次元復元／モーション推定からの復元（`cg/3d-reconstruction.yaml` #motion-reconstruction）

- [ページ未作成] カメラ位置・姿勢の推定
- [ページ未作成] カメラモーションと3次元位置の推定
- [ページ未作成] 大量の画像を用いた復元（SfM）

## アニメーション／CGアニメーションの構成要素（`cg/animation.yaml` #components）

- [draft] `/cg/animation/apparent-motion-and-stop-motion`
- [ページ未作成] アニメーション技法
- [draft] `/cg/animation/camera-work`

## アニメーション／キーフレームアニメーション（`cg/animation.yaml` #keyframe）

- [ページ未作成] キーフレーム法とスケルトン法
- [ページ未作成] キーフレームの補間
- [ページ未作成] 形状変形アニメーション
- [ページ未作成] 自由形状変形

## アニメーション／手続き型アニメーション（`cg/animation.yaml` #procedural）

- [ページ未作成] 進化・成長のアニメーション
- [ページ未作成] 自然現象のアニメーション
- [ページ未作成] パーティクルによるアニメーション
- [ページ未作成] AIを利用したアニメーション

## アニメーション／キャラクターアニメーション（`cg/animation.yaml` #character）

- [ページ未作成] フォワードキネマティクス
- [ページ未作成] インバースキネマティクス
- [ページ未作成] パスアニメーション
- [ページ未作成] モーションキャプチャ
- [ページ未作成] 筋肉変形アニメーション
- [ページ未作成] 表情のアニメーション
- [ページ未作成] 布地のアニメーション
- [ページ未作成] 髪の毛のアニメーション
- [ページ未作成] 群集アニメーション

## アニメーション／物理ベースアニメーション（`cg/animation.yaml` #physics-based）

- [draft] `/cg/animation/rigid-body-simulation`
- [ページ未作成] 弾性体の物理シミュレーション
- [ページ未作成] 衝突判定

## アニメーション／リアルタイムアニメーション（`cg/animation.yaml` #real-time）

- [ページ未作成] リアルタイムアニメーションの手法
- [draft] `/cg/animation/renderman-and-realtime-shaders`
- [ページ未作成] ゲーム物理

## アニメーション／実写映像との合成（`cg/animation.yaml` #live-action-compositing）

- [ページ未作成] 実写映像との合成時の条件
- [ページ未作成] カメラパラメータの整合
- [ページ未作成] 照明条件の整合

## デジタル画像の基本／デジタルカメラモデル（`cg/basics.yaml` #camera-model）

- [ ] `/cg/basics/camera-capture-and-cg`
- [ ] `/cg/basics/cg-and-image-processing`

## デジタル画像の基本／デジタル画像の表現（`cg/basics.yaml` #digital-image）

- [ ] `/cg/basics/image-digitization`
- [ ] `/cg/basics/image-sampling`
- [draft] `/cg/basics/sampling-theorem-and-interpolation`
- [ ] `/cg/basics/image-quantization`
- [ ] `/cg/basics/grayscale-and-color-images`
- [ ] `/cg/basics/vector-and-raster`

## デジタル画像の基本／ラスタ化と描画（`cg/basics.yaml` #rasterization）

- [ ] `/cg/basics/shape-rasterization`
- [draft] `/cg/basics/anti-aliasing`
- [draft] `/cg/basics/area-filling`
- [draft] `/cg/basics/gradient-generation`

## 2値画像処理／2値化（`cg/binary-image.yaml` #binarization）

- [ページ未作成] 2値化の意味
- [ページ未作成] p-タイル法
- [ページ未作成] モード法
- [ページ未作成] 判別分析法（大津の手法）

## 2値画像処理／2値画像の基本処理と計測（`cg/binary-image.yaml` #measurement）

- [ページ未作成] 連結性
- [ページ未作成] 輪郭追跡
- [ページ未作成] 収縮・膨張処理（モルフォロジー）
- [ページ未作成] ラベリング
- [ページ未作成] 形状特徴パラメータ
- [ページ未作成] 距離と距離変換画像

## 2値画像処理／線画像のベクトル化（`cg/binary-image.yaml` #vectorization）

- [ページ未作成] ベクトル化処理の流れ
- [ページ未作成] 細線化
- [ページ未作成] 細線の特徴点抽出とベクトル化

## 撮影とレンズ／カメラの仕組み（`cg/camera.yaml` #camera-structure）

- [ ] `/cg/camera/digital-camera-structure`

## 撮影とレンズ／レンズモデル（`cg/camera.yaml` #lens-model）

- [ページ未作成] 薄肉レンズ
- [ページ未作成] 厚肉レンズ
- [ページ未作成] 歪曲収差
- [ページ未作成] 周辺光量の低下

## 撮影とレンズ／撮影パラメータ（`cg/camera.yaml` #shooting-parameters）

- [ページ未作成] 撮影画角
- [ページ未作成] 画像の明るさ（露出）
- [ページ未作成] 被写界深度（フォーカス）
- [ページ未作成] フレームレート

## 撮影とレンズ／撮影と信号（`cg/camera.yaml` #capture-signal）

- [ページ未作成] カメラ応答関数
- [ページ未作成] 時系列画像
- [ページ未作成] カラー画像の撮影

## 深層学習による認識と生成／ニューラルネットワーク（`cg/deep-learning.yaml` #neural-network）

- [ページ未作成] 単純パーセプトロン
- [ページ未作成] 誤差逆伝播法

## 深層学習による認識と生成／深層学習（`cg/deep-learning.yaml` #deep-learning）

- [ページ未作成] 畳み込みニューラルネットワーク（CNN）
- [ページ未作成] 汎化能力の向上

## 深層学習による認識と生成／CNNによる画像認識と画像生成（`cg/deep-learning.yaml` #cnn）

- [ページ未作成] 画像分類
- [ページ未作成] 物体検出
- [ページ未作成] セマンティックセグメンテーション
- [ページ未作成] 姿勢推定
- [ページ未作成] GAN

## 画像の編集と合成／画像の合成（`cg/editing.yaml` #compositing）

- [ページ未作成] 画像間演算
- [ページ未作成] マスク処理
- [ページ未作成] 接続が自然な画像合成

## 画像の編集と合成／編集・補完（`cg/editing.yaml` #editing-completion）

- [ページ未作成] 自然な画像サイズ変更（リターゲティング）
- [ページ未作成] 画像の領域補完
- [ページ未作成] 画像からのテクスチャ合成

## パターン・特徴の検出とマッチング／テンプレートマッチング（`cg/feature-detection.yaml` #template-matching）

- [ページ未作成] テンプレートマッチング
- [ページ未作成] 類似度
- [ページ未作成] サブピクセル位置推定
- [ページ未作成] 高速探索法

## パターン・特徴の検出とマッチング／エッジ・ヒストグラムによる検出（`cg/feature-detection.yaml` #edge-histogram）

- [ページ未作成] チャンファーマッチング
- [ページ未作成] アクティブ探索

## パターン・特徴の検出とマッチング／特徴点の検出と記述（`cg/feature-detection.yaml` #feature-points）

- [ページ未作成] コーナー検出
- [ページ未作成] DoGによる特徴点とスケールの検出
- [ページ未作成] SIFT特徴
- [ページ未作成] 2値特徴量
- [ページ未作成] 対応点マッチング

## パターン・特徴の検出とマッチング／図形要素検出と顕著性（`cg/feature-detection.yaml` #shape-saliency）

- [ページ未作成] ハフ変換
- [ページ未作成] 一般化・ランダム化ハフ変換
- [ページ未作成] 顕著性マップ

## 周波数領域における処理／画像のフーリエ変換（`cg/frequency.yaml` #fourier）

- [ページ未作成] 2次元フーリエ変換
- [ページ未作成] 画像のフーリエ変換

## 周波数領域における処理／周波数フィルタリング（`cg/frequency.yaml` #frequency-filtering）

- [ページ未作成] 周波数フィルタリングの原理
- [ページ未作成] 空間フィルタリングとの関係
- [draft] `/cg/frequency/lowpass-highpass-bandpass-filters`
- [ページ未作成] 高域強調フィルタ

## 歴史／CGと画像処理の歴史（`cg/history.yaml` #history）

- [ページ未作成] CGの歴史
- [ページ未作成] 画像処理の歴史

## 画像符号化／圧縮の基礎とファイル形式（`cg/image-coding.yaml` #basics）

- [draft] `/cg/image-coding/compression-and-file-formats`
- [ページ未作成] 画像圧縮の原理
- [ページ未作成] 画像符号化の分類
- [ページ未作成] 画像ファイル形式一覧

## 画像符号化／2値画像の符号化（`cg/image-coding.yaml` #binary-coding）

- [ページ未作成] 2値画像のデータ量
- [ページ未作成] ランレングス符号化
- [ページ未作成] チェイン符号化

## 画像符号化／グレースケール画像の符号化（`cg/image-coding.yaml` #grayscale-coding）

- [ページ未作成] ハフマン符号化
- [ページ未作成] 算術符号化
- [ページ未作成] 予測符号化
- [ページ未作成] 変換符号化

## 画像符号化／カラー画像・動画像の符号化（`cg/image-coding.yaml` #color-video-coding）

- [ページ未作成] カラー画像の符号化
- [ページ未作成] 静止画像の符号化方式
- [draft] `/cg/image-coding/video-coding-methods`

## 画像の性質と色／画像の性質（`cg/image-properties.yaml` #properties）

- [ ] `/cg/image-properties/dynamic-range-and-gradation`
- [draft] `/cg/image-properties/image-statistics`
- [ページ未作成] 画像のノイズ
- [ページ未作成] コントラストとシャープネス

## 画像の性質と色／色空間とカラーモデル（`cg/image-properties.yaml` #color-spaces）

- [ページ未作成] CIE-RGB表色系
- [ページ未作成] CIE-XYZ表色系
- [ページ未作成] CIE-L*a*b*色空間
- [ページ未作成] YIQ表色系
- [ページ未作成] sRGB色空間
- [ページ未作成] 輝度信号と色差信号
- [ページ未作成] HSI変換と逆変換

## 知的財産権／知的財産権（`cg/ip-rights.yaml` #ip-rights）

- [ページ未作成] 知的財産権の概要
- [ページ未作成] 著作権・著作物利用のルール
- [ページ未作成] 著作権侵害
- [ページ未作成] 産業財産権と不正競争防止法
- [ページ未作成] ©マークによる著作権表示

## モデリング／形状モデル（`cg/modeling.yaml` #shape-models）

- [ ] `/cg/modeling/shape-model-overview`
- [draft] `/cg/modeling/csg-representation`
- [draft] `/cg/modeling/boundary-representation`
- [draft] `/cg/modeling/sweep-representation`
- [ページ未作成] 境界表現のデータ構造
- [ページ未作成] オイラー表現

## モデリング／曲線と曲面（`cg/modeling.yaml` #curves-surfaces）

- [ ] `/cg/modeling/curve-surface-equations`
- [ ] `/cg/modeling/quadratic-curve`
- [ ] `/cg/modeling/bezier-curve-surface`
- [ ] `/cg/modeling/bezier-curve-properties`
- [ページ未作成] ファーガソン曲線
- [ページ未作成] 双3次クーンズ曲面
- [draft] `/cg/modeling/b-spline-curve-surface`
- [ページ未作成] 有理ベジェ曲線・曲面
- [ページ未作成] NURBS曲線・曲面
- [draft] `/cg/modeling/parametric-curve-surface`
- [ページ未作成] パラメトリック曲線・曲面の微分幾何

## モデリング／ポリゴン（`cg/modeling.yaml` #polygon）

- [draft] `/cg/modeling/polygon-surface`
- [ページ未作成] 細分割曲面
- [ページ未作成] ポリゴン曲面の詳細度制御
- [ページ未作成] ポリゴン曲面の平滑化処理
- [ページ未作成] ポリゴン曲面のパラメータ化
- [ページ未作成] セグメンテーション
- [ページ未作成] 電子透かし
- [ページ未作成] 形状検索

## モデリング／ボリューム（`cg/modeling.yaml` #volume）

- [draft] `/cg/modeling/voxel-and-volume-data`
- [ページ未作成] 四分木と八分木
- [ページ未作成] メタボール
- [draft] `/cg/modeling/isosurface-extraction`

## モデリング／特殊な形状表現（`cg/modeling.yaml` #special-shapes）

- [draft] `/cg/modeling/particle-system`
- [ページ未作成] ポイントベースドモデリング
- [ページ未作成] フラクタル

## NPRと可視化／ノンフォトリアリスティックレンダリング（`cg/npr.yaml` #npr）

- [ページ未作成] NPRの概要と特徴
- [ページ未作成] NPRの目的と表現技法
- [ページ未作成] 線を入力とするNPR
- [ページ未作成] 2次元画像を入力とするNPR
- [ページ未作成] 3次元形状を入力とするNPR
- [ページ未作成] 形状の誇張表現
- [ページ未作成] アニメーションへの対応
- [ページ未作成] NPRの描画実現方法の分類

## NPRと可視化／可視化（`cg/npr.yaml` #visualization）

- [ページ未作成] サイエンティフィックビジュアライゼーション
- [ページ未作成] 可視化処理の流れとデータマッピング
- [ページ未作成] 3次元スカラデータの可視化
- [ページ未作成] ベクトル・テンソルデータの可視化
- [ページ未作成] 情報可視化

## 光学的解析とシーンの復元／放射量と反射（`cg/optical-analysis.yaml` #radiometry-reflection）

- [ページ未作成] 放射量の定義と基本法則
- [ページ未作成] 反射の種類
- [ページ未作成] BRDFの定義と性質
- [ページ未作成] 反射モデル

## 光学的解析とシーンの復元／反射・形状の復元（`cg/optical-analysis.yaml` #shape-recovery）

- [ページ未作成] 反射成分の分離
- [ページ未作成] 位置の推定と法線の推定
- [ページ未作成] 照度差ステレオ

## 光学的解析とシーンの復元／反射特性・照明環境の復元（`cg/optical-analysis.yaml` #reflectance-illumination）

- [ページ未作成] BRDFの計測と反射パラメータの推定
- [ページ未作成] 光源分布の計測
- [ページ未作成] インバースライティング
- [ページ未作成] 形状・反射特性・照明環境の同時復元

## パターン認識と機械学習／パターン認識の基礎（`cg/pattern-recognition.yaml` #basics）

- [ページ未作成] パターン認識の流れ
- [ページ未作成] 画像からの特徴抽出
- [ページ未作成] プロトタイプ法による識別
- [ページ未作成] クラスの分布を考慮した識別
- [ページ未作成] NN法・kNN法
- [ページ未作成] kd-tree法
- [ページ未作成] ハッシングによる近似最近傍探索
- [ページ未作成] 線形判別分析
- [ページ未作成] 部分空間法

## パターン認識と機械学習／機械学習（`cg/pattern-recognition.yaml` #machine-learning）

- [ページ未作成] 教師なし学習・教師あり学習
- [ページ未作成] k-means法によるクラスタリング
- [ページ未作成] 主成分分析による次元圧縮
- [ページ未作成] アダブースト
- [ページ未作成] サポートベクタマシン
- [ページ未作成] ランダムフォレスト

## パターン認識と機械学習／画像認識への応用（`cg/pattern-recognition.yaml` #applications）

- [ページ未作成] 物体検出
- [ページ未作成] 類似画像検索
- [ページ未作成] 人体姿勢推定

## 知覚／視覚と知覚（`cg/perception.yaml` #perception）

- [ページ未作成] 眼の構造と視野
- [ページ未作成] 形の見え
- [ページ未作成] 大きさの恒常性
- [ページ未作成] 動きの見え
- [ページ未作成] 見えの3次元性
- [ページ未作成] 視線の動き

## レンダリング／写実的レンダリング（`cg/rendering.yaml` #photorealistic）

- [ ] `/cg/rendering/photorealism-and-reality-elements`

## レンダリング／隠面消去（`cg/rendering.yaml` #hidden-surface）

- [draft] `/cg/rendering/hidden-surface-removal-methods`
- [draft] `/cg/rendering/priority-algorithm`
- [draft] `/cg/rendering/scanline-algorithm`
- [draft] `/cg/rendering/z-buffer-algorithm`
- [draft] `/cg/rendering/ray-tracing-algorithm`

## レンダリング／シェーディング（`cg/rendering.yaml` #shading）

- [draft] `/cg/rendering/shading-purpose`
- [ページ未作成] 光を表す量
- [ページ未作成] シェーディングモデル
- [ページ未作成] 環境光の表現
- [ページ未作成] 拡散反射の表現
- [ページ未作成] 鏡面反射の表現
- [draft] `/cg/rendering/reflection-transmission-refraction`
- [draft] `/cg/rendering/scattering-and-attenuation`
- [draft] `/cg/rendering/smooth-shading`
- [ページ未作成] グローシェーディング
- [ページ未作成] フォンシェーディング

## レンダリング／シャドウイング（`cg/rendering.yaml` #shadowing）

- [draft] `/cg/rendering/shadows-from-point-and-directional-lights`
- [ページ未作成] 大きさをもつ光源による影

## レンダリング／マッピング（`cg/rendering.yaml` #mapping）

- [ページ未作成] マッピングの目的と手法
- [draft] `/cg/rendering/texture-mapping`
- [ページ未作成] アンチエイリアシング
- [draft] `/cg/rendering/bump-mapping`
- [ページ未作成] 環境マッピング
- [ページ未作成] ソリッドテクスチャマッピング

## レンダリング／イメージベースドレンダリング（`cg/rendering.yaml` #image-based-rendering）

- [ページ未作成] イメージベースドレンダリングの技法
- [ページ未作成] 投影テクスチャマッピング
- [ページ未作成] 画像再投影の利用
- [ページ未作成] パノラマ画像の利用
- [ページ未作成] ビューモーフィング
- [ページ未作成] レイデータベースアプローチ
- [ページ未作成] イメージベースドライティング

## レンダリング／大域照明計算（`cg/rendering.yaml` #global-illumination）

- [ページ未作成] レンダリング方程式
- [ページ未作成] ラジオシティ法
- [ページ未作成] モンテカルロ法
- [ページ未作成] マルコフ連鎖モンテカルロ法

## 画像の復元と生成／ぼけ・ぶれの復元（`cg/restoration.yaml` #deblur）

- [ページ未作成] 画像の劣化モデル
- [ページ未作成] 点拡がり関数（PSF）
- [ページ未作成] 逆フィルタ・ウィーナフィルタ

## 画像の復元と生成／さまざまな復元・生成（`cg/restoration.yaml` #restoration-generation）

- [ページ未作成] ノイズ除去
- [ページ未作成] 画像超解像
- [ページ未作成] ガイド画像を利用した画像処理
- [ページ未作成] 勾配に基づく画像処理

## 画像の復元と生成／コンピュテーショナルフォトグラフィ（`cg/restoration.yaml` #computational-photography）

- [ページ未作成] コンピュテーショナルフォトグラフィの考え方
- [ページ未作成] 光線の記録とその利用
- [ページ未作成] 符号化撮像

## 領域分割／領域の特徴量（`cg/segmentation.yaml` #region-features）

- [ページ未作成] 領域のテクスチャ
- [ページ未作成] 2次元フーリエ変換による周波数特徴量
- [ページ未作成] ガボールフィルタによる局所周波数特徴量
- [ページ未作成] 同時生起行列による統計的特徴量

## 領域分割／領域分割の手法（`cg/segmentation.yaml` #segmentation-methods）

- [ページ未作成] 領域分割のアプローチ
- [ページ未作成] 階層的統合による領域分割
- [ページ未作成] パラメータ空間でのクラス分け
- [ページ未作成] ミーンシフト
- [ページ未作成] エッジを利用した領域分割
- [ページ未作成] グラフカット
- [ページ未作成] 画像のセグメンテーション

## 空間フィルタリング／空間フィルタリングと平滑化（`cg/spatial-filtering.yaml` #smoothing）

- [ページ未作成] 空間フィルタリング
- [ページ未作成] 平滑化（平均化・重み付き平均化）
- [ページ未作成] 特定方向の平滑化

## 空間フィルタリング／エッジ抽出と鮮鋭化（`cg/spatial-filtering.yaml` #edge-sharpening）

- [ページ未作成] 微分フィルタ
- [ページ未作成] プリューウィットフィルタ・ソーベルフィルタ
- [ページ未作成] 2次微分とラプラシアン
- [ページ未作成] エッジ検出
- [ページ未作成] 鮮鋭化

## 空間フィルタリング／エッジを保存した平滑化（`cg/spatial-filtering.yaml` #edge-preserving）

- [ページ未作成] 局所領域の選択による平滑化
- [ページ未作成] k最近隣平均化フィルタ
- [ページ未作成] バイラテラルフィルタ
- [ページ未作成] ノンローカルミーンフィルタ
- [ページ未作成] メディアンフィルタ

## 空間フィルタリング／特殊効果（`cg/spatial-filtering.yaml` #special-effects）

- [ページ未作成] 領域に基づく変換による特殊効果

## CGシステムとデバイス／CGシステムとソフトウェア（`cg/systems.yaml` #systems-software）

- [ページ未作成] CGシステムの応用
- [ページ未作成] グラフィックス装置
- [draft] `/cg/systems/graphics-api`
- [ ] `/cg/systems/cg-software`
- [ページ未作成] 3次元モデル記述言語・フォーマット

## CGシステムとデバイス／リアルタイム3次元CG（`cg/systems.yaml` #real-time-3d）

- [draft] `/cg/systems/parallel-processing`
- [draft] `/cg/systems/rendering-pipeline`
- [draft] `/cg/systems/gpu-based-cg-processing`
- [ページ未作成] CGハードウェアの性能評価
- [ページ未作成] 3次元CGハードウェアの変遷

## CGシステムとデバイス／入力装置（`cg/systems.yaml` #input-devices）

- [ページ未作成] 3次元ディジタイザ
- [ページ未作成] モーションキャプチャ装置
- [ページ未作成] 3次元座標入力・フォースディスプレイ
- [ページ未作成] 関節角入力装置
- [ページ未作成] 撮像素子の種類と特徴
- [ページ未作成] 高速度カメラ・リニアイメージセンサ
- [ページ未作成] 距離画像の取得

## CGシステムとデバイス／出力装置とディスプレイ（`cg/systems.yaml` #output-devices）

- [ページ未作成] 両眼立体視（メガネ方式）
- [ページ未作成] 裸眼立体視
- [ページ未作成] ヘッドマウントディスプレイ
- [ページ未作成] 3次元ディスプレイの映像フォーマット
- [ページ未作成] ホログラフィ
- [ページ未作成] ボリュームディスプレイ
- [ページ未作成] 切削加工装置・3Dプリンタ
- [ページ未作成] ディスプレイ
- [ページ未作成] プリンタ

## CGシステムとデバイス／記録メディアと規格（`cg/systems.yaml` #recording-standards）

- [ページ未作成] 画像記録メディア
- [ページ未作成] 画像処理の特性測定
- [ページ未作成] テレビジョンの走査方式
- [ページ未作成] 映像信号接続端子

## 画素ごとの濃淡・色変換／濃淡変換（`cg/tone-conversion.yaml` #tone）

- [ページ未作成] ヒストグラム
- [ページ未作成] トーンカーブ
- [ページ未作成] 折れ線型・累乗型トーンカーブ
- [ページ未作成] S字トーンカーブ
- [ページ未作成] ヒストグラム平坦化
- [ページ未作成] 各種の濃淡変換

## 画素ごとの濃淡・色変換／特殊効果と2値化（`cg/tone-conversion.yaml` #special-effects）

- [ページ未作成] 濃淡の反転
- [ページ未作成] ポスタリゼーション
- [ページ未作成] 2値化（しきい値処理）
- [ページ未作成] ソラリゼーション
- [ページ未作成] 画素ごとの変換による特殊効果

## 画素ごとの濃淡・色変換／色変換（`cg/tone-conversion.yaml` #color）

- [ページ未作成] RGBトーンカーブによる変換
- [ページ未作成] 擬似カラー
- [ページ未作成] 色相・彩度・明度の変化
- [ページ未作成] 色補正
- [ページ未作成] 色変換

## 変換と投影／図形の幾何学的変換（`cg/transformation.yaml` #coordinate-transform）

- [ ] `/cg/transformation/coordinate-systems`
- [ ] `/cg/transformation/basic-transformations`
- [ ] `/cg/transformation/transformation-composition`
- [ ] `/cg/transformation/reflection-and-skew`
- [ ] `/cg/transformation/affine-transformation`
- [ ] `/cg/transformation/projective-transformation`

## 変換と投影／ビューイングパイプライン（`cg/transformation.yaml` #viewing-pipeline）

- [ ] `/cg/transformation/viewing-pipeline-transformations`
- [draft] `/cg/transformation/hierarchical-modeling`

## 変換と投影／投影とクリッピング（`cg/transformation.yaml` #projection-and-clipping）

- [ ] `/cg/transformation/pinhole-camera`
- [ ] `/cg/transformation/perspective-and-parallel-projection`
- [ ] `/cg/transformation/projection-steps`
- [draft] `/cg/transformation/projection-calculation`
- [draft] `/cg/transformation/clipping-algorithms`
- [draft] `/cg/transformation/vanishing-points-and-n-point-perspective`
- [ ] `/cg/transformation/parallel-projection-types`

## 変換と投影／画像の幾何学的変換（`cg/transformation.yaml` #image-geometric-transform）

- [ページ未作成] 画像の幾何学的変換
- [ページ未作成] 画像の再標本化と補間
- [ページ未作成] ニアレストネイバー
- [ページ未作成] バイリニア補間・バイキュービック補間
- [ページ未作成] 再標本化時のアンチエイリアシング
- [ページ未作成] イメージモザイキング
- [ページ未作成] パノラマ画像の生成

## 動画像処理／移動体検出（`cg/video.yaml` #motion-detection）

- [ページ未作成] 差分画像
- [ページ未作成] 背景差分法
- [ページ未作成] フレーム間差分法
- [ページ未作成] 統計的背景差分法

## 動画像処理／オプティカルフロー（`cg/video.yaml` #optical-flow）

- [ページ未作成] オプティカルフローの求め方
- [ページ未作成] ブロックマッチング法
- [ページ未作成] 勾配法
- [ページ未作成] イメージピラミッドを用いた求め方

## 動画像処理／物体追跡（`cg/video.yaml` #tracking）

- [ページ未作成] 物体追跡の手法分類
- [ページ未作成] KLTトラッカー
- [ページ未作成] ミーンシフトトラッキング
- [ページ未作成] ベイジアンフィルタ
