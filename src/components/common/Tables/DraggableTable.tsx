import { Table } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useRef } from 'react'
import './AntTable.css'

export default function DraggableTable<T extends object>(props: TableProps<T>) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined

    let el: HTMLElement | null = null
    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const getEl = () =>
      wrap.querySelector<HTMLElement>('.ant-table-body') ||
      wrap.querySelector<HTMLElement>('.ant-table-content')

    const onDown = (e: MouseEvent) => {
      el = getEl()
      if (!el) return
      isDown = true
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    }

    const onUp = () => {
      isDown = false
      if (el) el.style.cursor = 'grab'
    }

    const onMove = (e: MouseEvent) => {
      if (!isDown || !el) return
      const x = e.pageX - el.offsetLeft
      const walk = x - startX
      if (Math.abs(walk) > 4) {
        e.preventDefault()
        el.style.cursor = 'grabbing'
        el.scrollLeft = scrollLeft - walk * 1.3
      }
    }

    const timer = window.setTimeout(() => {
      const scrollEl = getEl()
      if (scrollEl) scrollEl.style.cursor = 'grab'
    }, 80)

    wrap.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    wrap.addEventListener('mousemove', onMove)

    return () => {
      window.clearTimeout(timer)
      wrap.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      wrap.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div ref={wrapRef} className="draggable-table-wrap">
      <Table {...props} />
    </div>
  )
}
