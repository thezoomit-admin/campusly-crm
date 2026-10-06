import { useState } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import { downloadExcelExport, fetchExportTable, printExportTable } from '@/lib/tableExport'

type ExportActionsProps = {
  title: string
  path: string
}

export default function ExportActions({ title, path }: ExportActionsProps) {
  const [busy, setBusy] = useState<'excel' | 'print' | null>(null)

  async function onExcel() {
    setBusy('excel')
    try {
      await downloadExcelExport(path, `${title.toLowerCase()}.xlsx`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to export. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function onPrint() {
    setBusy('print')
    try {
      const table = await fetchExportTable(path)
      printExportTable(table)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to print. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'excel',
      label: 'Excel',
      disabled: busy !== null,
      onClick: () => void onExcel(),
    },
    {
      key: 'print',
      label: 'Print',
      disabled: busy !== null,
      onClick: () => void onPrint(),
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} disabled={busy !== null}>
      <span>
        <PrimaryButton
          variant="outline"
          loading={busy !== null}
          label={
            <span className="inline-flex items-center gap-1.5">
              Export
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </span>
          }
        />
      </span>
    </Dropdown>
  )
}
