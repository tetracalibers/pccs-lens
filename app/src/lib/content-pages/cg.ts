import { resolve } from "$app/paths"
import type { ResolvedPathname } from "$app/types"
import cgBasicsData from "./cg/basics.yaml"
import cgImagePropertiesData from "./cg/image-properties.yaml"
import cgCameraData from "./cg/camera.yaml"
import cgTransformationData from "./cg/transformation.yaml"
import cgModelingData from "./cg/modeling.yaml"
import cgRenderingData from "./cg/rendering.yaml"
import cgAnimationData from "./cg/animation.yaml"
import cgToneConversionData from "./cg/tone-conversion.yaml"
import cgSpatialFilteringData from "./cg/spatial-filtering.yaml"
import cgFrequencyData from "./cg/frequency.yaml"
import cgBinaryImageData from "./cg/binary-image.yaml"
import cgRestorationData from "./cg/restoration.yaml"
import cgEditingData from "./cg/editing.yaml"
import cgNprData from "./cg/npr.yaml"
import cgSegmentationData from "./cg/segmentation.yaml"
import cgFeatureDetectionData from "./cg/feature-detection.yaml"
import cgPatternRecognitionData from "./cg/pattern-recognition.yaml"
import cgDeepLearningData from "./cg/deep-learning.yaml"
import cgVideoData from "./cg/video.yaml"
import cgReconstructionData from "./cg/3d-reconstruction.yaml"
import cgOpticalAnalysisData from "./cg/optical-analysis.yaml"
import cgImageCodingData from "./cg/image-coding.yaml"
import cgSystemsData from "./cg/systems.yaml"
import cgPerceptionData from "./cg/perception.yaml"
import cgIpRightsData from "./cg/ip-rights.yaml"
import cgHistoryData from "./cg/history.yaml"
import type { PageLink } from "./types"
import type { CgGroup } from "$lib/meta/group"

export interface CgDraftLink {
  title: string
  group: CgGroup[]
}

export type CgLink = PageLink | CgDraftLink

export interface CgSection {
  heading: string
  id: string
  links: CgLink[]
}

interface CgPageData {
  title: string
  /** 一覧カードに表示する短い説明文。 */
  summary: string
  sections: CgSection[]
}

export interface CgPage extends CgPageData {
  /** 動的ルート /cg/[slug] の slug（YAMLファイル名、例: "basics"）。 */
  route: string
  href: ResolvedPathname
}

// YAML データからユニットページを組み立てる。route は YAML ファイル名（slug）と一致させる。
const makePage = (route: string, data: unknown): CgPage => ({
  route,
  href: resolve("/cg/[slug]", { slug: route }),
  ...(data as CgPageData)
})

/** /cg 一覧での区分（カリキュラム上のグルーピング）。`id` は同ページ内のアンカー。 */
export interface CgGroupDef {
  id: string
  label: string
  /** この区分に属するユニットページ。表示順・前後ナビ・記事送りの順序の起点。 */
  pages: CgPage[]
}

/**
 * /cg のカリキュラム区分。ページの集合と並び順の「単一の情報源」。
 * カードの表示順・フッターの前後ナビ・記事送りはすべてここから導出される。
 * 並べ替え・入れ替え・追加・削除はこの配列だけを編集すればよい。
 */
export const cgGroups: CgGroupDef[] = [
  {
    id: "foundation",
    label: "基礎",
    pages: [
      makePage("basics", cgBasicsData),
      makePage("image-properties", cgImagePropertiesData),
      makePage("camera", cgCameraData),
      makePage("transformation", cgTransformationData)
    ]
  },
  {
    id: "synthesis",
    label: "コンピュータグラフィックス",
    pages: [
      makePage("modeling", cgModelingData),
      makePage("rendering", cgRenderingData),
      makePage("animation", cgAnimationData)
    ]
  },
  {
    id: "image-processing",
    label: "基本的な画像処理",
    pages: [
      makePage("tone-conversion", cgToneConversionData),
      makePage("spatial-filtering", cgSpatialFilteringData),
      makePage("frequency", cgFrequencyData),
      makePage("binary-image", cgBinaryImageData),
      makePage("restoration", cgRestorationData),
      makePage("editing", cgEditingData)
    ]
  },
  {
    id: "expression",
    label: "表現と可視化",
    pages: [makePage("npr", cgNprData)]
  },
  {
    id: "analysis",
    label: "画像処理の応用と解析",
    pages: [
      makePage("segmentation", cgSegmentationData),
      makePage("feature-detection", cgFeatureDetectionData),
      makePage("pattern-recognition", cgPatternRecognitionData),
      makePage("deep-learning", cgDeepLearningData),
      makePage("video", cgVideoData),
      makePage("3d-reconstruction", cgReconstructionData),
      makePage("optical-analysis", cgOpticalAnalysisData)
    ]
  },
  {
    id: "systems",
    label: "データとシステム",
    pages: [makePage("image-coding", cgImageCodingData), makePage("systems", cgSystemsData)]
  },
  {
    id: "related",
    label: "知っておきたい関連知識",
    pages: [
      makePage("perception", cgPerceptionData),
      makePage("ip-rights", cgIpRightsData),
      makePage("history", cgHistoryData)
    ]
  }
]

/** 全ユニットページをカリキュラム順（cgGroups の区分・ページ順）に平坦化した一覧。 */
export const cgPages: CgPage[] = cgGroups.flatMap((group) => group.pages)

export const cgPageByRoute: Map<string, CgPage> = new Map(cgPages.map((page) => [page.route, page]))

/** route(slug) → 所属区分の id。「一覧へ戻る」のアンカー解決に使う。 */
export const cgGroupIdByRoute: Map<string, string> = new Map(
  cgGroups.flatMap((group) => group.pages.map((page) => [page.route, group.id] as const))
)
