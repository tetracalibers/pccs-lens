// フィルタ（大分類 → ユニット → 孤立ページ）の UI と状態。
//
// 2 段構成。上段は大分類 3 つのトグル（囲みとしては描かないが、フィルタの単位としては残す）。
// 下段は ON になっている大分類のユニット個別トグル。
//
// 状態は永続化しない。開くたびにデフォルト（CG系のみ ON・孤立非表示）から始める。

/**
 * @param {HTMLElement} container
 * @param {() => void} onChange
 */
export const createFilters = (container, onChange) => {
  /** @type {{ groups: Set<string>, units: Set<string>, showIsolated: boolean }} */
  const state = { groups: new Set(), units: new Set(), showIsolated: false }

  /** 初回だけデフォルト（`defaultOn`）を適用し、以降はユーザーの選択を保つ。 */
  let initialized = false

  /** 一度 UI に出したユニット。再走査で増えたものを見分けるために持つ。 */
  const knownUnits = new Set()

  const checkbox = ({ id, label, count, checked, modifier, onToggle }) => {
    const row = document.createElement("div")
    row.className = `filter-row${modifier ? ` filter-row--${modifier}` : ""}`

    const input = document.createElement("input")
    input.type = "checkbox"
    input.id = id
    input.checked = checked
    input.addEventListener("change", () => onToggle(input.checked))

    const text = document.createElement("label")
    text.htmlFor = id
    text.textContent = label

    row.append(input, text)

    if (count !== undefined) {
      const badge = document.createElement("span")
      badge.className = "filter-row__count"
      badge.textContent = String(count)
      row.append(badge)
    }

    return row
  }

  /**
   * データに合わせて UI を組み直す。
   *
   * 再走査で増えたユニットは ON から始める（新しく起こしたページがいきなり隠れないように）。
   *
   * @param {object} data 走査結果
   */
  const setData = (data) => {
    if (!initialized) {
      for (const group of data.groups) if (group.defaultOn) state.groups.add(group.id)
      initialized = true
    }
    for (const unit of data.units) {
      if (!knownUnits.has(unit.id)) {
        knownUnits.add(unit.id)
        state.units.add(unit.id)
      }
    }

    // 消えたユニットは状態からも落とす。
    const present = new Set(data.units.map((unit) => unit.id))
    for (const id of [...knownUnits]) {
      if (!present.has(id)) {
        knownUnits.delete(id)
        state.units.delete(id)
      }
    }

    container.replaceChildren()

    for (const group of data.groups) {
      const section = document.createElement("div")
      section.className = "filter-group"

      const unitList = document.createElement("div")
      unitList.className = "filter-units"
      unitList.hidden = !state.groups.has(group.id)

      section.append(
        checkbox({
          id: `group-${group.id}`,
          label: group.label,
          count: group.pageCount,
          checked: state.groups.has(group.id),
          modifier: "group",
          onToggle: (checked) => {
            if (checked) state.groups.add(group.id)
            else state.groups.delete(group.id)
            unitList.hidden = !checked
            onChange()
          }
        })
      )

      for (const unit of data.units.filter((candidate) => candidate.group === group.id)) {
        unitList.append(
          checkbox({
            id: `unit-${unit.id}`,
            label: unit.label,
            count: unit.pageCount,
            checked: state.units.has(unit.id),
            onToggle: (checked) => {
              if (checked) state.units.add(unit.id)
              else state.units.delete(unit.id)
              onChange()
            }
          })
        )
      }

      section.append(unitList)
      container.append(section)
    }

    const divider = document.createElement("hr")
    divider.className = "filter-divider"
    container.append(divider)

    container.append(
      checkbox({
        id: "show-isolated",
        label: "孤立ページ",
        count: data.stats.isolated,
        checked: state.showIsolated,
        onToggle: (checked) => {
          state.showIsolated = checked
          onChange()
        }
      })
    )
  }

  return { state, setData }
}
