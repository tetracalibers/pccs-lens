import { resolve } from "$app/paths"
import type { ResolvedPathname } from "$app/types"
import cgBasicsData from "./cg-basics.yaml"
import cgImagePropertiesData from "./cg-image-properties.yaml"
import cgCameraData from "./cg-camera.yaml"
import cgTransformationData from "./cg-transformation.yaml"
import cgModelingData from "./cg-modeling.yaml"
import cgRenderingData from "./cg-rendering.yaml"
import cgAnimationData from "./cg-animation.yaml"
import cgRasterizationData from "./cg-rasterization.yaml"
import cgToneConversionData from "./cg-tone-conversion.yaml"
import cgSpatialFilteringData from "./cg-spatial-filtering.yaml"
import cgFrequencyData from "./cg-frequency.yaml"
import cgBinaryImageData from "./cg-binary-image.yaml"
import cgRestorationData from "./cg-restoration.yaml"
import cgEditingData from "./cg-editing.yaml"
import cgNprData from "./cg-npr.yaml"
import cgSegmentationData from "./cg-segmentation.yaml"
import cgFeatureDetectionData from "./cg-feature-detection.yaml"
import cgPatternRecognitionData from "./cg-pattern-recognition.yaml"
import cgDeepLearningData from "./cg-deep-learning.yaml"
import cgVideoData from "./cg-video.yaml"
import cgReconstructionData from "./cg-3d-reconstruction.yaml"
import cgOpticalAnalysisData from "./cg-optical-analysis.yaml"
import cgImageCodingData from "./cg-image-coding.yaml"
import cgSystemsData from "./cg-systems.yaml"
import cgPerceptionData from "./cg-perception.yaml"
import cgIpRightsData from "./cg-ip-rights.yaml"
import cgHistoryData from "./cg-history.yaml"
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
  /** ルートセグメント（例: "cg-basics"）。 */
  route: string
  href: ResolvedPathname
}

export const cgBasics: CgPage = {
  route: "cg-basics",
  href: resolve("/cg-basics"),
  ...(cgBasicsData as unknown as CgPageData)
}

export const cgImageProperties: CgPage = {
  route: "cg-image-properties",
  href: resolve("/cg-image-properties"),
  ...(cgImagePropertiesData as unknown as CgPageData)
}

export const cgCamera: CgPage = {
  route: "cg-camera",
  href: resolve("/cg-camera"),
  ...(cgCameraData as unknown as CgPageData)
}

export const cgTransformation: CgPage = {
  route: "cg-transformation",
  href: resolve("/cg-transformation"),
  ...(cgTransformationData as unknown as CgPageData)
}

export const cgModeling: CgPage = {
  route: "cg-modeling",
  href: resolve("/cg-modeling"),
  ...(cgModelingData as unknown as CgPageData)
}

export const cgRendering: CgPage = {
  route: "cg-rendering",
  href: resolve("/cg-rendering"),
  ...(cgRenderingData as unknown as CgPageData)
}

export const cgAnimation: CgPage = {
  route: "cg-animation",
  href: resolve("/cg-animation"),
  ...(cgAnimationData as unknown as CgPageData)
}

export const cgRasterization: CgPage = {
  route: "cg-rasterization",
  href: resolve("/cg-rasterization"),
  ...(cgRasterizationData as unknown as CgPageData)
}

export const cgToneConversion: CgPage = {
  route: "cg-tone-conversion",
  href: resolve("/cg-tone-conversion"),
  ...(cgToneConversionData as unknown as CgPageData)
}

export const cgSpatialFiltering: CgPage = {
  route: "cg-spatial-filtering",
  href: resolve("/cg-spatial-filtering"),
  ...(cgSpatialFilteringData as unknown as CgPageData)
}

export const cgFrequency: CgPage = {
  route: "cg-frequency",
  href: resolve("/cg-frequency"),
  ...(cgFrequencyData as unknown as CgPageData)
}

export const cgBinaryImage: CgPage = {
  route: "cg-binary-image",
  href: resolve("/cg-binary-image"),
  ...(cgBinaryImageData as unknown as CgPageData)
}

export const cgRestoration: CgPage = {
  route: "cg-restoration",
  href: resolve("/cg-restoration"),
  ...(cgRestorationData as unknown as CgPageData)
}

export const cgEditing: CgPage = {
  route: "cg-editing",
  href: resolve("/cg-editing"),
  ...(cgEditingData as unknown as CgPageData)
}

export const cgNpr: CgPage = {
  route: "cg-npr",
  href: resolve("/cg-npr"),
  ...(cgNprData as unknown as CgPageData)
}

export const cgSegmentation: CgPage = {
  route: "cg-segmentation",
  href: resolve("/cg-segmentation"),
  ...(cgSegmentationData as unknown as CgPageData)
}

export const cgFeatureDetection: CgPage = {
  route: "cg-feature-detection",
  href: resolve("/cg-feature-detection"),
  ...(cgFeatureDetectionData as unknown as CgPageData)
}

export const cgPatternRecognition: CgPage = {
  route: "cg-pattern-recognition",
  href: resolve("/cg-pattern-recognition"),
  ...(cgPatternRecognitionData as unknown as CgPageData)
}

export const cgDeepLearning: CgPage = {
  route: "cg-deep-learning",
  href: resolve("/cg-deep-learning"),
  ...(cgDeepLearningData as unknown as CgPageData)
}

export const cgVideo: CgPage = {
  route: "cg-video",
  href: resolve("/cg-video"),
  ...(cgVideoData as unknown as CgPageData)
}

export const cgReconstruction: CgPage = {
  route: "cg-3d-reconstruction",
  href: resolve("/cg-3d-reconstruction"),
  ...(cgReconstructionData as unknown as CgPageData)
}

export const cgOpticalAnalysis: CgPage = {
  route: "cg-optical-analysis",
  href: resolve("/cg-optical-analysis"),
  ...(cgOpticalAnalysisData as unknown as CgPageData)
}

export const cgImageCoding: CgPage = {
  route: "cg-image-coding",
  href: resolve("/cg-image-coding"),
  ...(cgImageCodingData as unknown as CgPageData)
}

export const cgSystems: CgPage = {
  route: "cg-systems",
  href: resolve("/cg-systems"),
  ...(cgSystemsData as unknown as CgPageData)
}

export const cgPerception: CgPage = {
  route: "cg-perception",
  href: resolve("/cg-perception"),
  ...(cgPerceptionData as unknown as CgPageData)
}

export const cgIpRights: CgPage = {
  route: "cg-ip-rights",
  href: resolve("/cg-ip-rights"),
  ...(cgIpRightsData as unknown as CgPageData)
}

export const cgHistory: CgPage = {
  route: "cg-history",
  href: resolve("/cg-history"),
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
