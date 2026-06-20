import { resolve } from "$app/paths"
import type { ResolvedPathname } from "$app/types"
import cgBasicsData from "./cg/basics.yaml"
import cgImagePropertiesData from "./cg/image-properties.yaml"
import cgCameraData from "./cg/camera.yaml"
import cgTransformationData from "./cg/transformation.yaml"
import cgModelingData from "./cg/modeling.yaml"
import cgRenderingData from "./cg/rendering.yaml"
import cgAnimationData from "./cg/animation.yaml"
import cgRasterizationData from "./cg/rasterization.yaml"
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

export const cgBasics: CgPage = {
  route: "basics",
  href: resolve("/cg/[slug]", { slug: "basics" }),
  ...(cgBasicsData as unknown as CgPageData)
}

export const cgImageProperties: CgPage = {
  route: "image-properties",
  href: resolve("/cg/[slug]", { slug: "image-properties" }),
  ...(cgImagePropertiesData as unknown as CgPageData)
}

export const cgCamera: CgPage = {
  route: "camera",
  href: resolve("/cg/[slug]", { slug: "camera" }),
  ...(cgCameraData as unknown as CgPageData)
}

export const cgTransformation: CgPage = {
  route: "transformation",
  href: resolve("/cg/[slug]", { slug: "transformation" }),
  ...(cgTransformationData as unknown as CgPageData)
}

export const cgModeling: CgPage = {
  route: "modeling",
  href: resolve("/cg/[slug]", { slug: "modeling" }),
  ...(cgModelingData as unknown as CgPageData)
}

export const cgRendering: CgPage = {
  route: "rendering",
  href: resolve("/cg/[slug]", { slug: "rendering" }),
  ...(cgRenderingData as unknown as CgPageData)
}

export const cgAnimation: CgPage = {
  route: "animation",
  href: resolve("/cg/[slug]", { slug: "animation" }),
  ...(cgAnimationData as unknown as CgPageData)
}

export const cgRasterization: CgPage = {
  route: "rasterization",
  href: resolve("/cg/[slug]", { slug: "rasterization" }),
  ...(cgRasterizationData as unknown as CgPageData)
}

export const cgToneConversion: CgPage = {
  route: "tone-conversion",
  href: resolve("/cg/[slug]", { slug: "tone-conversion" }),
  ...(cgToneConversionData as unknown as CgPageData)
}

export const cgSpatialFiltering: CgPage = {
  route: "spatial-filtering",
  href: resolve("/cg/[slug]", { slug: "spatial-filtering" }),
  ...(cgSpatialFilteringData as unknown as CgPageData)
}

export const cgFrequency: CgPage = {
  route: "frequency",
  href: resolve("/cg/[slug]", { slug: "frequency" }),
  ...(cgFrequencyData as unknown as CgPageData)
}

export const cgBinaryImage: CgPage = {
  route: "binary-image",
  href: resolve("/cg/[slug]", { slug: "binary-image" }),
  ...(cgBinaryImageData as unknown as CgPageData)
}

export const cgRestoration: CgPage = {
  route: "restoration",
  href: resolve("/cg/[slug]", { slug: "restoration" }),
  ...(cgRestorationData as unknown as CgPageData)
}

export const cgEditing: CgPage = {
  route: "editing",
  href: resolve("/cg/[slug]", { slug: "editing" }),
  ...(cgEditingData as unknown as CgPageData)
}

export const cgNpr: CgPage = {
  route: "npr",
  href: resolve("/cg/[slug]", { slug: "npr" }),
  ...(cgNprData as unknown as CgPageData)
}

export const cgSegmentation: CgPage = {
  route: "segmentation",
  href: resolve("/cg/[slug]", { slug: "segmentation" }),
  ...(cgSegmentationData as unknown as CgPageData)
}

export const cgFeatureDetection: CgPage = {
  route: "feature-detection",
  href: resolve("/cg/[slug]", { slug: "feature-detection" }),
  ...(cgFeatureDetectionData as unknown as CgPageData)
}

export const cgPatternRecognition: CgPage = {
  route: "pattern-recognition",
  href: resolve("/cg/[slug]", { slug: "pattern-recognition" }),
  ...(cgPatternRecognitionData as unknown as CgPageData)
}

export const cgDeepLearning: CgPage = {
  route: "deep-learning",
  href: resolve("/cg/[slug]", { slug: "deep-learning" }),
  ...(cgDeepLearningData as unknown as CgPageData)
}

export const cgVideo: CgPage = {
  route: "video",
  href: resolve("/cg/[slug]", { slug: "video" }),
  ...(cgVideoData as unknown as CgPageData)
}

export const cgReconstruction: CgPage = {
  route: "3d-reconstruction",
  href: resolve("/cg/[slug]", { slug: "3d-reconstruction" }),
  ...(cgReconstructionData as unknown as CgPageData)
}

export const cgOpticalAnalysis: CgPage = {
  route: "optical-analysis",
  href: resolve("/cg/[slug]", { slug: "optical-analysis" }),
  ...(cgOpticalAnalysisData as unknown as CgPageData)
}

export const cgImageCoding: CgPage = {
  route: "image-coding",
  href: resolve("/cg/[slug]", { slug: "image-coding" }),
  ...(cgImageCodingData as unknown as CgPageData)
}

export const cgSystems: CgPage = {
  route: "systems",
  href: resolve("/cg/[slug]", { slug: "systems" }),
  ...(cgSystemsData as unknown as CgPageData)
}

export const cgPerception: CgPage = {
  route: "perception",
  href: resolve("/cg/[slug]", { slug: "perception" }),
  ...(cgPerceptionData as unknown as CgPageData)
}

export const cgIpRights: CgPage = {
  route: "ip-rights",
  href: resolve("/cg/[slug]", { slug: "ip-rights" }),
  ...(cgIpRightsData as unknown as CgPageData)
}

export const cgHistory: CgPage = {
  route: "history",
  href: resolve("/cg/[slug]", { slug: "history" }),
  ...(cgHistoryData as unknown as CgPageData)
}

// 学習カリキュラムの順序（基礎 → CG合成 → 基本的な画像処理 → NPR/可視化 → 画像解析 → 周辺）
export const cgPages: CgPage[] = [
  cgBasics,
  cgImageProperties,
  cgCamera,
  cgTransformation,
  cgModeling,
  cgRendering,
  cgAnimation,
  cgRasterization,
  cgToneConversion,
  cgSpatialFiltering,
  cgFrequency,
  cgBinaryImage,
  cgRestoration,
  cgEditing,
  cgNpr,
  cgSegmentation,
  cgFeatureDetection,
  cgPatternRecognition,
  cgDeepLearning,
  cgVideo,
  cgReconstruction,
  cgOpticalAnalysis,
  cgImageCoding,
  cgSystems,
  cgPerception,
  cgIpRights,
  cgHistory
]

export const cgPageByRoute: Map<string, CgPage> = new Map(cgPages.map((page) => [page.route, page]))

/** /cg 一覧での区分（カリキュラム上のグルーピング）。`id` は同ページ内のアンカー。 */
export interface CgGroupDef {
  id: string
  label: string
  /** この区分に属するページの route（slug）。cgPages の並び順に対応。 */
  routes: string[]
}

export const cgGroups: CgGroupDef[] = [
  {
    id: "foundation",
    label: "基礎",
    routes: ["basics", "rasterization", "image-properties", "camera", "transformation"]
  },
  {
    id: "synthesis",
    label: "コンピュータグラフィックス",
    routes: ["modeling", "rendering", "animation"]
  },
  {
    id: "image-processing",
    label: "基本的な画像処理",
    routes: [
      "tone-conversion",
      "spatial-filtering",
      "frequency",
      "binary-image",
      "restoration",
      "editing"
    ]
  },
  { id: "expression", label: "表現と可視化", routes: ["npr"] },
  {
    id: "analysis",
    label: "画像処理の応用と解析",
    routes: [
      "segmentation",
      "feature-detection",
      "pattern-recognition",
      "deep-learning",
      "video",
      "3d-reconstruction",
      "optical-analysis"
    ]
  },
  { id: "systems", label: "画像データとシステム", routes: ["image-coding", "systems"] },
  { id: "related", label: "知っておきたい関連知識", routes: ["perception", "ip-rights", "history"] }
]

/** route(slug) → 所属区分の id。「一覧へ戻る」のアンカー解決に使う。 */
export const cgGroupIdByRoute: Map<string, string> = new Map(
  cgGroups.flatMap((group) => group.routes.map((route) => [route, group.id] as const))
)

/**
 * cgGroups の区分・route 順に並べたユニットページ一覧。
 * ページ送り（前後ナビ）の順序の単一の情報源。cgGroups を組み替えれば自動で追従する。
 */
export const cgPagesInCurriculumOrder: CgPage[] = cgGroups.flatMap((group) =>
  group.routes.flatMap((route) => {
    const page = cgPageByRoute.get(route)
    return page ? [page] : []
  })
)
