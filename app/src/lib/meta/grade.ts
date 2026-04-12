export type AftGrade = "3" | "2" | "1" | "uc"
export type AftGradeCSV =
  | AftGrade
  | `${AftGrade},${AftGrade}`
  | `${AftGrade},${AftGrade},${AftGrade}`

export const sortGrades = (grades: AftGrade[]): AftGrade[] => {
  const gradeOrder: AftGrade[] = ["3", "2", "1", "uc"]
  return grades.sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))
}

export const gradeCSV2Array = (gradeCSV: AftGradeCSV): AftGrade[] => {
  const grades = gradeCSV.split(",") as AftGrade[]
  return sortGrades(grades)
}

export const gradeArray2CSV = (grades: AftGrade[]): AftGradeCSV => {
  const sortedGrades = sortGrades(grades)
  return sortedGrades.join(",") as AftGradeCSV
}
