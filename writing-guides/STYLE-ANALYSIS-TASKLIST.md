# 文体解析タスクリスト

各記事を `author-style-analyzer` で分析したかのチェックリスト。
分析は `/author-style-analyzer #<id>`（カンマ区切りで複数指定可。slug との混在も可）で行う。詳細はスキル `author-style-analyzer` を参照。

- チェック済み `[x]` … 分析済み（結果が `writing-guides/` の4ガイドへ反映済み）
- 未チェック `[ ]` … 未分析
- `[draft]` … ページは作成済みだが `draft: true`。分析対象外。
- `[ページ未作成]` … まだページが存在しない下書き（YAML の `DraftLink`／`CgDraftLink`）。分析対象外。
- draft・未作成のものも YAML 上の並び順を保つため一覧に混ぜて掲載する（チェックボックスは付けない）。
- 対象は解説記事（`layout: guide-content` の `+page.svx`）のみ。トップ・一覧ページ、ゲーム、慣用色名マップ、配色シミュレータなど記事以外のページは分析対象ではないので載せない。
- セクション見出しの `#<id>` が、そのままスキルへ渡せるスコープ指定。色の理論・色の活用分野は YAML のトップレベル大分類（カテゴリ）単位、CGと画像処理は YAML の `sections[].id`（セクション）単位。
- 各セクション内の並びはコンテンツ YAML の並び順に忠実に従う。
- CG のセクション id はユニットをまたいで重複することがある（`#basics`＝画像符号化／パターン認識、`#special-effects`＝空間フィルタリング／画素ごとの濃淡・色変換）。指定するときはユニット名も添える。

---

## 色の理論 — 色の表し方（`color-theory.yaml` #color-expression）

- [x] `/color-theory/color-three-attributes`
- [x] `/color-theory/pccs-basics`
- [x] `/color-theory/color-system-types`
- [x] `/color-theory/color-wheel-and-color-solid`
- [x] `/color-theory/pccs-color-system`
- [x] `/color-theory/how-to-draw-pccs-color-wheel`
- [x] `/color-theory/munsell-color-system`
- [x] `/color-theory/color-name-types`
- [ページ未作成] 物体色の色名
- [ページ未作成] 光源色の色名
- [x] `/color-theory/basic-color-terms`
- [ページ未作成] ISCC-NBS色名法

## 色の理論 — 配色と色彩調和（`color-theory.yaml` #color-scheme-and-harmony）

- [x] `/color-theory/hue-tone-difference`
- [x] `/color-theory/color-area-proportion`
- [x] `/color-theory/gradient-color-scheme`
- [x] `/color-theory/dominant-and-tone-on-tone`
- [x] `/color-theory/tonal-color-scheme`
- [x] `/color-theory/camaieu-and-faux-camaieu`
- [x] `/color-theory/bicolor-and-tricolor`
- [x] `/color-theory/color-wheel-based-color-schemes`
- [x] `/color-theory/natural-harmony`
- [ページ未作成] 色の三属性と配色イメージ
- [ページ未作成] イメージ別の配色法
- [x] `/color-theory/unity-and-variety`
- [draft] `/color-theory/chevreul-color-harmony`
- [draft] `/color-theory/judd-four-principles`
- [draft] `/color-theory/natural-hue-sequence`
- [ページ未作成] 色相分割による調和
- [ページ未作成] 混色から考える調和
- [ページ未作成] ムーン＆スペンサーの色彩調和論

## 色の理論 — 色が見えるしくみ（`color-theory.yaml` #how-color-is-perceived）

- [x] `/color-theory/how-color-works`
- [x] `/color-theory/electromagnetic-waves`
- [x] `/color-theory/light-components-and-reflectance`
- [draft] `/color-theory/light-phenomena`
- [x] `/color-theory/eye-structure`
- [x] `/color-theory/light-path-through-the-retina`
- [x] `/color-theory/photoreceptor-types-and-distribution`
- [x] `/color-theory/brightness-sensitivity-and-adaptation`
- [draft] `/color-theory/perceptual-constancy`
- [x] `/color-theory/color-vision-theories`
- [x] `/color-theory/opponent-color-response`
- [ページ未作成] NCS表色系

## 色の理論 — 色の作り方と色再現（`color-theory.yaml` #color-creation-and-reproduction）

- [x] `/color-theory/color-mixing-basics`
- [x] `/color-theory/additive-color-mixing-types`
- [x] `/color-theory/real-world-color-mixing`
- [draft] `/color-theory/digital-color-generation`
- [draft] `/color-theory/color-gamut`
- [x] `/color-theory/color-matching-and-grassmanns-law`
- [x] `/color-theory/rgb-color-system`
- [x] `/color-theory/xyz-color-system`
- [draft] `/color-theory/xy-chromaticity-diagram`
- [draft] `/color-theory/colorimetric-illuminants`
- [ページ未作成] 色差の表示
- [ページ未作成] L*a*b*色空間
- [ページ未作成] オストワルト表色系

## 色の理論 — 色の見え方（`color-theory.yaml` #color-appearance）

- [x] `/color-theory/adjacent-color-influence`
- [x] `/color-theory/color-contrast`
- [x] `/color-theory/contrast-phenomena`
- [draft] `/color-theory/color-assimilation`
- [draft] `/color-theory/color-area-effect`
- [x] `/color-theory/subjective-color`
- [ ] `/color-theory/optical-illusions`
- [x] `/color-theory/what-is-lighting`
- [x] `/color-theory/color-temperature-and-light-color`
- [draft] `/color-theory/blackbody-radiation`
- [x] `/color-theory/illuminance-and-lighting-design`
- [draft] `/color-theory/photometric-quantities`
- [draft] `/color-theory/color-rendering`
- [x] `/color-theory/lamp-types`
- [x] `/color-theory/photometric-and-radiometric-quantities`
- [ページ未作成] 物体表面の質感と光
- [ページ未作成] 色の様相
- [ページ未作成] 色の現れ方の分類
- [ページ未作成] 三属性間の影響
- [ページ未作成] 光の入射角の影響

## 色の理論 — 色のはたらき方（`color-theory.yaml` #color-functions）

- [x] `/color-theory/color-roles`
- [x] `/color-theory/visual-clarity-and-visibility`
- [x] `/color-theory/color-sensations`
- [draft] `/color-theory/color-preference`
- [x] `/color-theory/color-association-symbolism`
- [ページ未作成] 記憶色と色記憶

## 色の理論 — 色の見え方の多様性（`color-theory.yaml` #color-vision-diversity）

- [x] `/color-theory/color-vision-characteristics`
- [x] `/color-theory/color-vision-types`
- [ページ未作成] 混同しやすい色
- [ページ未作成] 色の誤認
- [draft] `/color-theory/age-related-vision-changes`
- [draft] `/color-theory/elderly-vision-characteristics`
- [draft] `/color-theory/age-related-eye-diseases`
- [ページ未作成] 色覚の遺伝
- [ページ未作成] 色覚検査法

## 色の理論 — 色の測り方（`color-theory.yaml` #color-measurement）

- [ページ未作成] 測色の基本
- [ページ未作成] 視感測色
- [ページ未作成] 物理測色
- [ページ未作成] 測り方による色の分類
- [ ] `/color-theory/psychological-scaling-method`
- [draft] `/color-theory/psychological-scale-types`
- [ページ未作成] 一対比較法
- [ページ未作成] SD法
- [ページ未作成] 色のイメージにおける因子
- [ページ未作成] 知覚の度合いと閾
- [ページ未作成] 心理物理学的測定法
- [ページ未作成] 感覚と弁別閾の法則性

## 色の理論 — 色彩文化の発展（`color-theory.yaml` #color-culture-development）

- [x] `/color-theory/ancient-european-colors`
- [x] `/color-theory/medieval-european-colors`
- [x] `/color-theory/modern-european-colors`
- [ページ未作成] 古代の日本と色彩
- [ページ未作成] 古代から中近世の日本と色彩
- [ページ未作成] 近代の日本の色彩

## 色の活用分野 — デザイン（`color-fields.yaml` #design）

- [ ] `/color-fields/visual-design-and-color`
- [draft] `/color-fields/media-design-concepts`
- [ページ未作成] カラーマネジメント
- [draft] `/color-fields/digital-image-basics`
- [ ] `/color-fields/color-universal-design`
- [draft] `/color-fields/color-vision-accessibility`
- [draft] `/color-fields/color-universal-design-process`
- [draft] `/color-fields/color-design-tips`
- [draft] `/color-fields/color-universal-design-improvement`

## 色の活用分野 — マーケティング（`color-fields.yaml` #marketing）

- [ページ未作成] カラーマーケティングの考え方
- [ページ未作成] カラーリサーチの目的
- [ページ未作成] カラーリサーチの手法
- [ページ未作成] カラーリサーチ用カラーコード
- [ページ未作成] カラーリサーチの分析ツール
- [ページ未作成] さまざまなカラー戦略
- [ページ未作成] CMFの考え方
- [ページ未作成] 消費者の感性とCMF
- [ページ未作成] ラインナップの展開とCMF
- [ページ未作成] 制作におけるCMF

## 色の活用分野 — ビジネス（`color-fields.yaml` #business）

- [draft] `/color-fields/color-effects-and-business`
- [ページ未作成] カラーコミュニケーションツール
- [ページ未作成] コンシューマプロダクツ
- [ページ未作成] 企業アイデンティティ戦略
- [ページ未作成] 商品企画とカラーバリエーション
- [ページ未作成] 商品価値とプランニングの視点
- [ページ未作成] 商品デザインとCMF
- [ページ未作成] 製造と色再現技術
- [ページ未作成] 流通とパッケージデザイン
- [ページ未作成] プロモーション
- [ページ未作成] 販売形態と色彩戦略

## 色の活用分野 — ファッション（`color-fields.yaml` #fashion）

- [ ] `/color-fields/fashion-color-concepts`
- [ページ未作成] PCCSで見るカラーコーディネート
- [ページ未作成] ファッションの配色用語
- [ ] `/color-fields/fashion-color`
- [draft] `/color-fields/fashion-trend`
- [draft] `/color-fields/fashion-style-categories`
- [draft] `/color-fields/fashion-image`
- [ページ未作成] ファッションカラーの変遷
- [ページ未作成] 繊維の種類と発色性
- [ページ未作成] 織物と編物
- [ページ未作成] カラーコーディネーターの役割
- [ページ未作成] カラー情報の収集
- [ページ未作成] カラー情報の分析
- [ページ未作成] シーズンテーマカラーの決定
- [ページ未作成] VMDの定義と分類
- [ページ未作成] 商品陳列の方法と効果

## 色の活用分野 — インテリア（`color-fields.yaml` #interior）

- [x] `/color-fields/interior-design-basics`
- [x] `/color-fields/interior-concept-history`
- [ページ未作成] インテリアと心理効果・視覚効果
- [draft] `/color-fields/interior-elements-classification`
- [ページ未作成] インテリアエレメントの配色
- [draft] `/color-fields/interior-space-zoning`
- [draft] `/color-fields/public-space-color-scheme`
- [draft] `/color-fields/private-space-color-scheme`
- [ページ未作成] サービス空間の配色
- [ページ未作成] PCCSで見るインテリアの配色形式
- [ページ未作成] インテリアスタイル

## 色の活用分野 — 景観色彩（`color-fields.yaml` #landscape-color）

- [x] `/color-fields/landscape-color-approach`
- [x] `/color-fields/housing-color-design-process`
- [ページ未作成] 景観法
- [ページ未作成] 景観計画
- [ページ未作成] 景観計画における色彩基準
- [ページ未作成] 色の三属性と景観形成
- [ページ未作成] 遠景・中景・近景の景観色彩

## CGと画像処理 — 画像からの3次元復元／画像と空間の幾何（`cg/3d-reconstruction.yaml` #geometry）

- [ページ未作成] 透視投影モデルと幾何学的関係
- [ページ未作成] 同次座標を用いた記述
- [ページ未作成] エピポーラ幾何

## CGと画像処理 — 画像からの3次元復元／カメラキャリブレーションとステレオ（`cg/3d-reconstruction.yaml` #calibration-stereo）

- [ページ未作成] カメラキャリブレーション
- [ページ未作成] 空間位置の計算
- [ページ未作成] 平行ステレオ
- [ページ未作成] ステレオマッチング
- [ページ未作成] マルチビューステレオ
- [ページ未作成] アクティブステレオ

## CGと画像処理 — 画像からの3次元復元／モーション推定からの復元（`cg/3d-reconstruction.yaml` #motion-reconstruction）

- [ページ未作成] カメラ位置・姿勢の推定
- [ページ未作成] カメラモーションと3次元位置の推定
- [ページ未作成] 大量の画像を用いた復元（SfM）

## CGと画像処理 — アニメーション／CGアニメーションの構成要素（`cg/animation.yaml` #components）

- [ページ未作成] 仮現運動とコマ撮り
- [ページ未作成] アニメーション技法
- [ページ未作成] カメラワーク

## CGと画像処理 — アニメーション／キーフレームアニメーション（`cg/animation.yaml` #keyframe）

- [ページ未作成] キーフレーム法とスケルトン法
- [ページ未作成] キーフレームの補間
- [ページ未作成] 形状変形アニメーション
- [ページ未作成] 自由形状変形

## CGと画像処理 — アニメーション／手続き型アニメーション（`cg/animation.yaml` #procedural）

- [ページ未作成] 進化・成長のアニメーション
- [ページ未作成] 自然現象のアニメーション
- [ページ未作成] パーティクルによるアニメーション
- [ページ未作成] AIを利用したアニメーション

## CGと画像処理 — アニメーション／キャラクターアニメーション（`cg/animation.yaml` #character）

- [ページ未作成] フォワードキネマティクス
- [ページ未作成] インバースキネマティクス
- [ページ未作成] パスアニメーション
- [ページ未作成] モーションキャプチャ
- [ページ未作成] 筋肉変形アニメーション
- [ページ未作成] 表情のアニメーション
- [ページ未作成] 布地のアニメーション
- [ページ未作成] 髪の毛のアニメーション
- [ページ未作成] 群集アニメーション

## CGと画像処理 — アニメーション／物理ベースアニメーション（`cg/animation.yaml` #physics-based）

- [ページ未作成] 剛体の物理シミュレーション
- [ページ未作成] 弾性体の物理シミュレーション
- [ページ未作成] 衝突判定

## CGと画像処理 — アニメーション／リアルタイムアニメーション（`cg/animation.yaml` #real-time）

- [ページ未作成] リアルタイムアニメーションの手法
- [ページ未作成] レンダーマンとリアルタイムシェーダ
- [ページ未作成] ゲーム物理

## CGと画像処理 — アニメーション／実写映像との合成（`cg/animation.yaml` #live-action-compositing）

- [ページ未作成] 実写映像との合成時の条件
- [ページ未作成] カメラパラメータの整合
- [ページ未作成] 照明条件の整合

## CGと画像処理 — デジタル画像の基本／デジタルカメラモデル（`cg/basics.yaml` #camera-model）

- [x] `/cg/basics/camera-capture-and-cg`
- [x] `/cg/basics/cg-and-image-processing`

## CGと画像処理 — デジタル画像の基本／デジタル画像の表現（`cg/basics.yaml` #digital-image）

- [x] `/cg/basics/image-digitization`
- [x] `/cg/basics/image-sampling`
- [x] `/cg/basics/image-quantization`
- [x] `/cg/basics/grayscale-and-color-images`
- [x] `/cg/basics/vector-and-raster`

## CGと画像処理 — デジタル画像の基本／ラスタ化と描画（`cg/basics.yaml` #rasterization）

- [x] `/cg/basics/shape-rasterization`
- [x] `/cg/basics/anti-aliasing`
- [x] `/cg/basics/area-filling`
- [x] `/cg/basics/gradient-generation`

## CGと画像処理 — 2値画像処理／2値化（`cg/binary-image.yaml` #binarization）

- [ページ未作成] 2値化の意味
- [ページ未作成] p-タイル法
- [ページ未作成] モード法
- [ページ未作成] 判別分析法（大津の手法）

## CGと画像処理 — 2値画像処理／2値画像の基本処理と計測（`cg/binary-image.yaml` #measurement）

- [ページ未作成] 連結性
- [ページ未作成] 輪郭追跡
- [ページ未作成] 収縮・膨張処理（モルフォロジー）
- [ページ未作成] ラベリング
- [ページ未作成] 形状特徴パラメータ
- [ページ未作成] 距離と距離変換画像

## CGと画像処理 — 2値画像処理／線画像のベクトル化（`cg/binary-image.yaml` #vectorization）

- [ページ未作成] ベクトル化処理の流れ
- [ページ未作成] 細線化
- [ページ未作成] 細線の特徴点抽出とベクトル化

## CGと画像処理 — 画像の撮影とカメラモデル／カメラを表す幾何モデル（`cg/camera.yaml` #camera-geometry）

- [ ] `/cg/camera/digital-camera-structure`
- [draft] `/cg/camera/pinhole-camera`
- [ページ未作成] 透視投影モデル

## CGと画像処理 — 画像の撮影とカメラモデル／レンズモデル（`cg/camera.yaml` #lens-model）

- [ページ未作成] 薄肉レンズ
- [ページ未作成] 厚肉レンズ
- [ページ未作成] 歪曲収差
- [ページ未作成] 周辺光量の低下

## CGと画像処理 — 画像の撮影とカメラモデル／撮影パラメータ（`cg/camera.yaml` #shooting-parameters）

- [ページ未作成] 撮影画角
- [ページ未作成] 画像の明るさ（露出）
- [ページ未作成] 被写界深度（フォーカス）
- [ページ未作成] フレームレート

## CGと画像処理 — 画像の撮影とカメラモデル／撮影と信号（`cg/camera.yaml` #capture-signal）

- [ページ未作成] カメラ応答関数
- [ページ未作成] 時系列画像
- [ページ未作成] カラー画像の撮影

## CGと画像処理 — 深層学習による認識と生成／ニューラルネットワーク（`cg/deep-learning.yaml` #neural-network）

- [ページ未作成] 単純パーセプトロン
- [ページ未作成] 誤差逆伝播法

## CGと画像処理 — 深層学習による認識と生成／深層学習（`cg/deep-learning.yaml` #deep-learning）

- [ページ未作成] 畳み込みニューラルネットワーク（CNN）
- [ページ未作成] 汎化能力の向上

## CGと画像処理 — 深層学習による認識と生成／CNNによる画像認識と画像生成（`cg/deep-learning.yaml` #cnn）

- [ページ未作成] 画像分類
- [ページ未作成] 物体検出
- [ページ未作成] セマンティックセグメンテーション
- [ページ未作成] 姿勢推定
- [ページ未作成] GAN

## CGと画像処理 — 画像の編集と合成／画像の合成（`cg/editing.yaml` #compositing）

- [ページ未作成] 画像間演算
- [ページ未作成] マスク処理
- [ページ未作成] 接続が自然な画像合成

## CGと画像処理 — 画像の編集と合成／編集・補完（`cg/editing.yaml` #editing-completion）

- [ページ未作成] 自然な画像サイズ変更（リターゲティング）
- [ページ未作成] 画像の領域補完
- [ページ未作成] 画像からのテクスチャ合成

## CGと画像処理 — パターン・特徴の検出とマッチング／テンプレートマッチング（`cg/feature-detection.yaml` #template-matching）

- [ページ未作成] テンプレートマッチング
- [ページ未作成] 類似度
- [ページ未作成] サブピクセル位置推定
- [ページ未作成] 高速探索法

## CGと画像処理 — パターン・特徴の検出とマッチング／エッジ・ヒストグラムによる検出（`cg/feature-detection.yaml` #edge-histogram）

- [ページ未作成] チャンファーマッチング
- [ページ未作成] アクティブ探索

## CGと画像処理 — パターン・特徴の検出とマッチング／特徴点の検出と記述（`cg/feature-detection.yaml` #feature-points）

- [ページ未作成] コーナー検出
- [ページ未作成] DoGによる特徴点とスケールの検出
- [ページ未作成] SIFT特徴
- [ページ未作成] 2値特徴量
- [ページ未作成] 対応点マッチング

## CGと画像処理 — パターン・特徴の検出とマッチング／図形要素検出と顕著性（`cg/feature-detection.yaml` #shape-saliency）

- [ページ未作成] ハフ変換
- [ページ未作成] 一般化・ランダム化ハフ変換
- [ページ未作成] 顕著性マップ

## CGと画像処理 — 周波数領域における処理／画像のフーリエ変換（`cg/frequency.yaml` #fourier）

- [ページ未作成] 2次元フーリエ変換
- [ページ未作成] 画像のフーリエ変換

## CGと画像処理 — 周波数領域における処理／周波数フィルタリング（`cg/frequency.yaml` #frequency-filtering）

- [ページ未作成] 周波数フィルタリングの原理
- [ページ未作成] 空間フィルタリングとの関係
- [ページ未作成] ローパス・ハイパス・バンドパスフィルタ
- [ページ未作成] 高域強調フィルタ

## CGと画像処理 — 歴史／CGと画像処理の歴史（`cg/history.yaml` #history）

- [ページ未作成] CGの歴史
- [ページ未作成] 画像処理の歴史

## CGと画像処理 — 画像符号化／圧縮の基礎とファイル形式（`cg/image-coding.yaml` #basics）

- [ページ未作成] 画像の圧縮とファイル形式
- [ページ未作成] 画像圧縮の原理
- [ページ未作成] 画像符号化の分類
- [ページ未作成] 画像ファイル形式一覧

## CGと画像処理 — 画像符号化／2値画像の符号化（`cg/image-coding.yaml` #binary-coding）

- [ページ未作成] 2値画像のデータ量
- [ページ未作成] ランレングス符号化
- [ページ未作成] チェイン符号化

## CGと画像処理 — 画像符号化／グレースケール画像の符号化（`cg/image-coding.yaml` #grayscale-coding）

- [ページ未作成] ハフマン符号化
- [ページ未作成] 算術符号化
- [ページ未作成] 予測符号化
- [ページ未作成] 変換符号化

## CGと画像処理 — 画像符号化／カラー画像・動画像の符号化（`cg/image-coding.yaml` #color-video-coding）

- [ページ未作成] カラー画像の符号化
- [ページ未作成] 静止画像の符号化方式
- [ページ未作成] 動画像の符号化方式

## CGと画像処理 — 画像の性質と色／画像の性質（`cg/image-properties.yaml` #properties）

- [ ] `/cg/image-properties/dynamic-range-and-gradation`
- [ページ未作成] 画像の統計量
- [ページ未作成] 画像のノイズ
- [ページ未作成] コントラストとシャープネス

## CGと画像処理 — 画像の性質と色／色空間とカラーモデル（`cg/image-properties.yaml` #color-spaces）

- [ページ未作成] CIE-RGB表色系
- [ページ未作成] CIE-XYZ表色系
- [ページ未作成] CIE-L*a*b*色空間
- [ページ未作成] YIQ表色系
- [ページ未作成] sRGB色空間
- [ページ未作成] 輝度信号と色差信号
- [ページ未作成] HSI変換と逆変換

## CGと画像処理 — 知的財産権／知的財産権（`cg/ip-rights.yaml` #ip-rights）

- [ページ未作成] 知的財産権の概要
- [ページ未作成] 著作権・著作物利用のルール
- [ページ未作成] 著作権侵害
- [ページ未作成] 産業財産権と不正競争防止法
- [ページ未作成] ©マークによる著作権表示

## CGと画像処理 — モデリング／形状モデル（`cg/modeling.yaml` #shape-models）

- [ページ未作成] さまざまな形状モデル
- [ページ未作成] CSG表現
- [ページ未作成] 境界表現
- [ページ未作成] スイープ表現
- [ページ未作成] 境界表現のデータ構造
- [ページ未作成] オイラー表現

## CGと画像処理 — モデリング／曲線と曲面（`cg/modeling.yaml` #curves-surfaces）

- [ページ未作成] 曲線・曲面の数式表現
- [ページ未作成] 2次曲線
- [ページ未作成] パラメトリック曲線・曲面
- [ページ未作成] ベジェ曲線・曲面
- [ページ未作成] ファーガソン曲線
- [ページ未作成] 双3次クーンズ曲面
- [ページ未作成] Bスプライン曲線・曲面
- [ページ未作成] 有理ベジェ曲線・曲面
- [ページ未作成] NURBS曲線・曲面
- [ページ未作成] パラメトリック曲線・曲面の微分幾何

## CGと画像処理 — モデリング／ポリゴン（`cg/modeling.yaml` #polygon）

- [ページ未作成] ポリゴン曲面
- [ページ未作成] 細分割曲面
- [ページ未作成] ポリゴン曲面の詳細度制御
- [ページ未作成] ポリゴン曲面の平滑化処理
- [ページ未作成] ポリゴン曲面のパラメータ化
- [ページ未作成] セグメンテーション
- [ページ未作成] 電子透かし
- [ページ未作成] 形状検索

## CGと画像処理 — モデリング／ボリューム（`cg/modeling.yaml` #volume）

- [ページ未作成] ボクセル
- [ページ未作成] 八分木
- [ページ未作成] メタボール
- [ページ未作成] 等値面抽出

## CGと画像処理 — モデリング／特殊な形状表現（`cg/modeling.yaml` #special-shapes）

- [ページ未作成] パーティクル
- [ページ未作成] ポイントベースドモデリング
- [ページ未作成] フラクタル

## CGと画像処理 — NPRと可視化／ノンフォトリアリスティックレンダリング（`cg/npr.yaml` #npr）

- [ページ未作成] NPRの概要と特徴
- [ページ未作成] NPRの目的と表現技法
- [ページ未作成] 線を入力とするNPR
- [ページ未作成] 2次元画像を入力とするNPR
- [ページ未作成] 3次元形状を入力とするNPR
- [ページ未作成] 形状の誇張表現
- [ページ未作成] アニメーションへの対応
- [ページ未作成] NPRの描画実現方法の分類

## CGと画像処理 — NPRと可視化／可視化（`cg/npr.yaml` #visualization）

- [ページ未作成] サイエンティフィックビジュアライゼーション
- [ページ未作成] 可視化処理の流れとデータマッピング
- [ページ未作成] 3次元スカラデータの可視化
- [ページ未作成] ベクトル・テンソルデータの可視化
- [ページ未作成] 情報可視化

## CGと画像処理 — 光学的解析とシーンの復元／放射量と反射（`cg/optical-analysis.yaml` #radiometry-reflection）

- [ページ未作成] 放射量の定義と基本法則
- [ページ未作成] 反射の種類
- [ページ未作成] BRDFの定義と性質
- [ページ未作成] 反射モデル

## CGと画像処理 — 光学的解析とシーンの復元／反射・形状の復元（`cg/optical-analysis.yaml` #shape-recovery）

- [ページ未作成] 反射成分の分離
- [ページ未作成] 位置の推定と法線の推定
- [ページ未作成] 照度差ステレオ

## CGと画像処理 — 光学的解析とシーンの復元／反射特性・照明環境の復元（`cg/optical-analysis.yaml` #reflectance-illumination）

- [ページ未作成] BRDFの計測と反射パラメータの推定
- [ページ未作成] 光源分布の計測
- [ページ未作成] インバースライティング
- [ページ未作成] 形状・反射特性・照明環境の同時復元

## CGと画像処理 — パターン認識と機械学習／パターン認識の基礎（`cg/pattern-recognition.yaml` #basics）

- [ページ未作成] パターン認識の流れ
- [ページ未作成] 画像からの特徴抽出
- [ページ未作成] プロトタイプ法による識別
- [ページ未作成] クラスの分布を考慮した識別
- [ページ未作成] NN法・kNN法
- [ページ未作成] kd-tree法
- [ページ未作成] ハッシングによる近似最近傍探索
- [ページ未作成] 線形判別分析
- [ページ未作成] 部分空間法

## CGと画像処理 — パターン認識と機械学習／機械学習（`cg/pattern-recognition.yaml` #machine-learning）

- [ページ未作成] 教師なし学習・教師あり学習
- [ページ未作成] k-means法によるクラスタリング
- [ページ未作成] 主成分分析による次元圧縮
- [ページ未作成] アダブースト
- [ページ未作成] サポートベクタマシン
- [ページ未作成] ランダムフォレスト

## CGと画像処理 — パターン認識と機械学習／画像認識への応用（`cg/pattern-recognition.yaml` #applications）

- [ページ未作成] 物体検出
- [ページ未作成] 類似画像検索
- [ページ未作成] 人体姿勢推定

## CGと画像処理 — 知覚／視覚と知覚（`cg/perception.yaml` #perception）

- [ページ未作成] 眼の構造と視野
- [ページ未作成] 形の見え
- [ページ未作成] 大きさの恒常性
- [ページ未作成] 動きの見え
- [ページ未作成] 見えの3次元性
- [ページ未作成] 視線の動き

## CGと画像処理 — レンダリング／写実的レンダリング（`cg/rendering.yaml` #photorealistic）

- [ページ未作成] 写実的表現
- [ページ未作成] リアリティの要素
- [ページ未作成] 写実的表現のためのモデリング
- [ページ未作成] レンダリングにおける処理

## CGと画像処理 — レンダリング／隠面消去（`cg/rendering.yaml` #hidden-surface）

- [ページ未作成] バックフェースカリング
- [ページ未作成] 隠面消去法の分類
- [ページ未作成] 優先順位アルゴリズム
- [ページ未作成] スキャンライン法
- [ページ未作成] Zバッファ法
- [ページ未作成] レイトレーシング法

## CGと画像処理 — レンダリング／シェーディング（`cg/rendering.yaml` #shading）

- [ページ未作成] シェーディングの目的
- [ページ未作成] 光を表す量
- [ページ未作成] シェーディングモデル
- [ページ未作成] 環境光の表現
- [ページ未作成] 拡散反射の表現
- [ページ未作成] 鏡面反射の表現
- [ページ未作成] 反射・透過・屈折の表現
- [ページ未作成] 散乱・減衰の表現
- [ページ未作成] スムーズシェーディングの手法
- [ページ未作成] グローシェーディング
- [ページ未作成] フォンシェーディング

## CGと画像処理 — レンダリング／シャドウイング（`cg/rendering.yaml` #shadowing）

- [ページ未作成] 平行光源・点光源による影
- [ページ未作成] 大きさをもつ光源による影

## CGと画像処理 — レンダリング／マッピング（`cg/rendering.yaml` #mapping）

- [ページ未作成] マッピングの目的と手法
- [ページ未作成] テクスチャマッピング
- [ページ未作成] アンチエイリアシング
- [ページ未作成] バンプマッピング
- [ページ未作成] 環境マッピング
- [ページ未作成] ソリッドテクスチャマッピング

## CGと画像処理 — レンダリング／イメージベースドレンダリング（`cg/rendering.yaml` #image-based-rendering）

- [ページ未作成] イメージベースドレンダリングの技法
- [ページ未作成] 投影テクスチャマッピング
- [ページ未作成] 画像再投影の利用
- [ページ未作成] パノラマ画像の利用
- [ページ未作成] ビューモーフィング
- [ページ未作成] レイデータベースアプローチ
- [ページ未作成] イメージベースドライティング

## CGと画像処理 — レンダリング／大域照明計算（`cg/rendering.yaml` #global-illumination）

- [ページ未作成] レンダリング方程式
- [ページ未作成] ラジオシティ法
- [ページ未作成] モンテカルロ法
- [ページ未作成] マルコフ連鎖モンテカルロ法

## CGと画像処理 — 画像の復元と生成／ぼけ・ぶれの復元（`cg/restoration.yaml` #deblur）

- [ページ未作成] 画像の劣化モデル
- [ページ未作成] 点拡がり関数（PSF）
- [ページ未作成] 逆フィルタ・ウィーナフィルタ

## CGと画像処理 — 画像の復元と生成／さまざまな復元・生成（`cg/restoration.yaml` #restoration-generation）

- [ページ未作成] ノイズ除去
- [ページ未作成] 画像超解像
- [ページ未作成] ガイド画像を利用した画像処理
- [ページ未作成] 勾配に基づく画像処理

## CGと画像処理 — 画像の復元と生成／コンピュテーショナルフォトグラフィ（`cg/restoration.yaml` #computational-photography）

- [ページ未作成] コンピュテーショナルフォトグラフィの考え方
- [ページ未作成] 光線の記録とその利用
- [ページ未作成] 符号化撮像

## CGと画像処理 — 領域分割／領域の特徴量（`cg/segmentation.yaml` #region-features）

- [ページ未作成] 領域のテクスチャ
- [ページ未作成] 2次元フーリエ変換による周波数特徴量
- [ページ未作成] ガボールフィルタによる局所周波数特徴量
- [ページ未作成] 同時生起行列による統計的特徴量

## CGと画像処理 — 領域分割／領域分割の手法（`cg/segmentation.yaml` #segmentation-methods）

- [ページ未作成] 領域分割のアプローチ
- [ページ未作成] 階層的統合による領域分割
- [ページ未作成] パラメータ空間でのクラス分け
- [ページ未作成] ミーンシフト
- [ページ未作成] エッジを利用した領域分割
- [ページ未作成] グラフカット
- [ページ未作成] 画像のセグメンテーション

## CGと画像処理 — 空間フィルタリング／空間フィルタリングと平滑化（`cg/spatial-filtering.yaml` #smoothing）

- [ページ未作成] 空間フィルタリング
- [ページ未作成] 平滑化（平均化・重み付き平均化）
- [ページ未作成] 特定方向の平滑化

## CGと画像処理 — 空間フィルタリング／エッジ抽出と鮮鋭化（`cg/spatial-filtering.yaml` #edge-sharpening）

- [ページ未作成] 微分フィルタ
- [ページ未作成] プリューウィットフィルタ・ソーベルフィルタ
- [ページ未作成] 2次微分とラプラシアン
- [ページ未作成] エッジ検出
- [ページ未作成] 鮮鋭化

## CGと画像処理 — 空間フィルタリング／エッジを保存した平滑化（`cg/spatial-filtering.yaml` #edge-preserving）

- [ページ未作成] 局所領域の選択による平滑化
- [ページ未作成] k最近隣平均化フィルタ
- [ページ未作成] バイラテラルフィルタ
- [ページ未作成] ノンローカルミーンフィルタ
- [ページ未作成] メディアンフィルタ

## CGと画像処理 — 空間フィルタリング／特殊効果（`cg/spatial-filtering.yaml` #special-effects）

- [ページ未作成] 領域に基づく変換による特殊効果

## CGと画像処理 — CGシステムとデバイス／CGシステムとソフトウェア（`cg/systems.yaml` #systems-software）

- [ページ未作成] CGシステムの応用と構成
- [ページ未作成] コンピュータネットワーク
- [ページ未作成] プログラム記述言語
- [ページ未作成] グラフィックス用API
- [ページ未作成] CGアプリケーションソフトウェア
- [ページ未作成] 3次元モデル記述言語・フォーマット

## CGと画像処理 — CGシステムとデバイス／リアルタイム3次元CG（`cg/systems.yaml` #real-time-3d）

- [ページ未作成] 並列処理
- [ページ未作成] 3次元CGハードウェアの変遷
- [ページ未作成] 描画処理の流れ
- [ページ未作成] GPUを利用したCG処理
- [ページ未作成] CGハードウェアの性能評価

## CGと画像処理 — CGシステムとデバイス／入力装置（`cg/systems.yaml` #input-devices）

- [ページ未作成] 3次元ディジタイザ
- [ページ未作成] モーションキャプチャ装置
- [ページ未作成] 3次元座標入力・フォースディスプレイ
- [ページ未作成] 関節角入力装置
- [ページ未作成] 撮像素子の種類と特徴
- [ページ未作成] 高速度カメラ・リニアイメージセンサ
- [ページ未作成] 距離画像の取得

## CGと画像処理 — CGシステムとデバイス／出力装置とディスプレイ（`cg/systems.yaml` #output-devices）

- [ページ未作成] 両眼立体視（メガネ方式）
- [ページ未作成] 裸眼立体視
- [ページ未作成] ヘッドマウントディスプレイ
- [ページ未作成] 3次元ディスプレイの映像フォーマット
- [ページ未作成] ホログラフィ
- [ページ未作成] ボリュームディスプレイ
- [ページ未作成] 切削加工装置・3Dプリンタ
- [ページ未作成] ディスプレイ
- [ページ未作成] プリンタ

## CGと画像処理 — CGシステムとデバイス／記録メディアと規格（`cg/systems.yaml` #recording-standards）

- [ページ未作成] 画像記録メディア
- [ページ未作成] 画像処理の特性測定
- [ページ未作成] テレビジョンの走査方式
- [ページ未作成] 映像信号接続端子

## CGと画像処理 — 画素ごとの濃淡・色変換／濃淡変換（`cg/tone-conversion.yaml` #tone）

- [ページ未作成] ヒストグラム
- [ページ未作成] トーンカーブ
- [ページ未作成] 折れ線型・累乗型トーンカーブ
- [ページ未作成] S字トーンカーブ
- [ページ未作成] ヒストグラム平坦化
- [ページ未作成] 各種の濃淡変換

## CGと画像処理 — 画素ごとの濃淡・色変換／特殊効果と2値化（`cg/tone-conversion.yaml` #special-effects）

- [ページ未作成] 濃淡の反転
- [ページ未作成] ポスタリゼーション
- [ページ未作成] 2値化（しきい値処理）
- [ページ未作成] ソラリゼーション
- [ページ未作成] 画素ごとの変換による特殊効果

## CGと画像処理 — 画素ごとの濃淡・色変換／色変換（`cg/tone-conversion.yaml` #color）

- [ページ未作成] RGBトーンカーブによる変換
- [ページ未作成] 擬似カラー
- [ページ未作成] 色相・彩度・明度の変化
- [ページ未作成] 色補正
- [ページ未作成] 色変換

## CGと画像処理 — 座標や図形の変換／図形の変換（`cg/transformation.yaml` #coordinate-transform）

- [x] `/cg/transformation/coordinate-systems`
- [x] `/cg/transformation/basic-transformations`
- [x] `/cg/transformation/transformation-composition`
- [x] `/cg/transformation/reflection-and-skew`
- [x] `/cg/transformation/affine-and-projective-transformation`

## CGと画像処理 — 座標や図形の変換／投影（`cg/transformation.yaml` #projection）

- [ページ未作成] カメラと投影
- [ページ未作成] 透視投影と平行投影
- [ページ未作成] 投影の手順
- [ページ未作成] 投影の計算法
- [ページ未作成] 消点とn点透視
- [ページ未作成] さまざまな平行投影

## CGと画像処理 — 座標や図形の変換／ビューイングパイプライン（`cg/transformation.yaml` #viewing-pipeline）

- [ページ未作成] ビューイングパイプラインでの変換
- [ページ未作成] ビューイングと視野変換
- [ページ未作成] クリッピング
- [ページ未作成] 階層モデリング

## CGと画像処理 — 座標や図形の変換／画像の幾何学的変換（`cg/transformation.yaml` #image-geometric-transform）

- [ページ未作成] 画像の幾何学的変換
- [ページ未作成] 画像の再標本化と補間
- [ページ未作成] ニアレストネイバー
- [ページ未作成] バイリニア補間・バイキュービック補間
- [ページ未作成] 再標本化時のアンチエイリアシング
- [ページ未作成] イメージモザイキング
- [ページ未作成] パノラマ画像の生成

## CGと画像処理 — 動画像処理／移動体検出（`cg/video.yaml` #motion-detection）

- [ページ未作成] 差分画像
- [ページ未作成] 背景差分法
- [ページ未作成] フレーム間差分法
- [ページ未作成] 統計的背景差分法

## CGと画像処理 — 動画像処理／オプティカルフロー（`cg/video.yaml` #optical-flow）

- [ページ未作成] オプティカルフローの求め方
- [ページ未作成] ブロックマッチング法
- [ページ未作成] 勾配法
- [ページ未作成] イメージピラミッドを用いた求め方

## CGと画像処理 — 動画像処理／物体追跡（`cg/video.yaml` #tracking）

- [ページ未作成] 物体追跡の手法分類
- [ページ未作成] KLTトラッカー
- [ページ未作成] ミーンシフトトラッキング
- [ページ未作成] ベイジアンフィルタ
