import { Button, Modal, Spin, message } from 'antd'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useState } from 'react'
import { formatMoney } from '@/modules/packages/utils/offerCalculator'
import { useGetReceiptQuery } from '../api/paymentsApi'
import type { ReceiptSnapshot } from '../types'

type ReceiptViewModalProps = {
  open: boolean
  receiptId: string | null
  onClose: () => void
}

function asSnapshot(value: unknown): ReceiptSnapshot | null {
  if (!value || typeof value !== 'object') return null
  return value as ReceiptSnapshot
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number) {
  if (n < 20) return ONES[n]
  const ten = Math.floor(n / 10)
  const one = n % 10
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ''}`
}

function threeDigits(n: number) {
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  if (!hundred) return twoDigits(rest)
  return `${ONES[hundred]} Hundred${rest ? ` ${twoDigits(rest)}` : ''}`
}

/** Indian/Bangladeshi numbering: crore / lakh / thousand */
function amountInWords(value: string | number | null | undefined, currency = 'BDT') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'

  const negative = amount < 0
  const abs = Math.abs(amount)
  let intPart = Math.floor(abs)
  const paisa = Math.round((abs - intPart) * 100)

  if (intPart === 0 && paisa === 0) return `${currency} Zero Only`

  const parts: string[] = []
  const crore = Math.floor(intPart / 1_00_00_000)
  intPart %= 1_00_00_000
  const lakh = Math.floor(intPart / 1_00_000)
  intPart %= 1_00_000
  const thousand = Math.floor(intPart / 1000)
  intPart %= 1000

  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`)
  if (intPart) parts.push(threeDigits(intPart))

  let words = parts.join(' ')
  if (paisa) words += `${words ? ' and ' : ''}${twoDigits(paisa)} Paisa`
  words = `${currency} ${words} Only`
  return negative ? `Minus ${words}` : words
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-[#e8eef5] py-2 text-[13px] last:border-b-0">
      <span className="text-[#6b7c8f]">{label}</span>
      <span className="font-semibold text-[#16324f]">{value}</span>
    </div>
  )
}

function SettlementRow({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <tr className={emphasize ? 'bg-[#f3faf0]' : undefined}>
      <td
        className={`border border-[#d7e0ea] px-3 py-2 ${emphasize ? 'font-semibold text-[#16324f]' : 'text-[#51657a]'}`}
      >
        {label}
      </td>
      <td
        className={`border border-[#d7e0ea] px-3 py-2 text-right tabular-nums ${emphasize ? 'font-bold text-[#257908]' : 'font-semibold text-[#16324f]'}`}
      >
        {value}
      </td>
    </tr>
  )
}

export default function ReceiptViewModal({ open, receiptId, onClose }: ReceiptViewModalProps) {
  const { data, isFetching, isError } = useGetReceiptQuery(receiptId || '', {
    skip: !open || !receiptId,
  })
  const [downloading, setDownloading] = useState(false)
  const snapshot = asSnapshot(data?.receipt.snapshot)
  const currency = snapshot?.currency || 'BDT'
  const company = (snapshot?.consultancyName || 'Education Consultancy').trim()

  function printReceipt() {
    window.print()
  }

  async function downloadReceiptPdf() {
    if (!snapshot || downloading) return
    const element = document.getElementById('payment-receipt-print')
    if (!element) {
      message.error('Receipt content is not ready yet.')
      return
    }

    setDownloading(true)
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 12
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const imgHeight = (canvas.height * usableWidth) / canvas.width

      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight)
      heightLeft -= usableHeight

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight)
        heightLeft -= usableHeight
      }

      pdf.save(`${snapshot.receiptNumber || 'receipt'}.pdf`)
    } catch {
      message.error('Unable to download receipt PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Payment Receipt"
      width={720}
      destroyOnHidden
      className="payment-receipt-modal"
      footer={
        <div className="flex justify-end gap-2 print:hidden">
          <Button onClick={onClose}>Close</Button>
          <Button onClick={() => void downloadReceiptPdf()} disabled={!snapshot} loading={downloading}>
            Download PDF
          </Button>
          <Button type="primary" onClick={printReceipt} disabled={!snapshot || downloading}>
            Print
          </Button>
        </div>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #payment-receipt-print,
          #payment-receipt-print * { visibility: visible !important; }
          #payment-receipt-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 24px 32px !important;
            background: #fff !important;
          }
          .payment-receipt-modal .ant-modal-close,
          .payment-receipt-modal .ant-modal-header,
          .payment-receipt-modal .ant-modal-footer { display: none !important; }
        }
      `}</style>

      {isFetching ? <Spin /> : null}
      {isError ? <p className="m-0 text-danger">Unable to load receipt.</p> : null}

      {snapshot ? (
        <div
          id="payment-receipt-print"
          className="overflow-hidden rounded-lg border border-[#d7e0ea] bg-white text-[#16324f] shadow-[0_1px_2px_rgba(22,50,79,0.04)]"
        >
          {/* Letterhead */}
          <div className="relative border-b-2 border-[#35ad0b] px-6 pb-4 pt-5">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#35ad0b]" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e4f6dc] text-sm font-bold tracking-wide text-[#257908]"
                  >
                    {company
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join('') || 'EC'}
                  </div>
                  <div>
                    <h2 className="m-0 text-lg font-bold tracking-wide text-[#16324f]">
                      {company.toUpperCase()}
                    </h2>
                    <p className="m-0 mt-0.5 text-xs text-[#6b7c8f]">
                      Education Consultancy · Student Services
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded border border-[#35ad0b]/40 bg-[#f3faf0] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#257908]">
                  Official Receipt
                </span>
                <p className="m-0 mt-2 text-[11px] uppercase tracking-wider text-[#8b97a1]">
                  Payment Acknowledgement
                </p>
              </div>
            </div>
          </div>

          {/* Document meta */}
          <div className="grid grid-cols-3 gap-px border-b border-[#e2e8f0] bg-[#e2e8f0]">
            <div className="bg-[#f8fafc] px-4 py-3">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-[#8b97a1]">
                Receipt No.
              </p>
              <p className="m-0 mt-1 text-sm font-bold tabular-nums text-[#16324f]">
                {snapshot.receiptNumber}
              </p>
            </div>
            <div className="bg-[#f8fafc] px-4 py-3">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-[#8b97a1]">
                Payment No.
              </p>
              <p className="m-0 mt-1 text-sm font-bold tabular-nums text-[#16324f]">
                {snapshot.paymentNumber || '—'}
              </p>
            </div>
            <div className="bg-[#f8fafc] px-4 py-3">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-[#8b97a1]">
                Payment Date
              </p>
              <p className="m-0 mt-1 text-sm font-bold text-[#16324f]">{snapshot.paymentDate}</p>
            </div>
          </div>

          <div className="grid gap-5 px-6 py-5">
            {/* Received from */}
            <section>
              <h3 className="m-0 mb-2 border-b border-[#e8eef5] pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7c8f]">
                Received From
              </h3>
              <MetaRow label="Student / Client" value={snapshot.studentName} />
              <MetaRow label="Lead / File ID" value={snapshot.leadCode} />
              <MetaRow label="Payment For" value={snapshot.paymentFor} />
            </section>

            {/* Amount band */}
            <section className="rounded-md border border-[#cfe9c0] bg-[#f3faf0] px-4 py-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2b8e09]">
                    Amount Received
                  </p>
                  <p className="m-0 mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#16324f]">
                    {formatMoney(snapshot.paymentAmount)}
                  </p>
                </div>
                <div className="text-right text-xs text-[#51657a]">
                  <p className="m-0">
                    Method: <strong className="text-[#16324f]">{snapshot.paymentMethod}</strong>
                  </p>
                  <p className="m-0 mt-1">
                    Ref:{' '}
                    <strong className="text-[#16324f]">{snapshot.transactionRef || '—'}</strong>
                  </p>
                </div>
              </div>
              <p className="mb-0 mt-3 border-t border-[#d7ecc8] pt-3 text-xs leading-relaxed text-[#51657a]">
                <span className="font-semibold text-[#6b7c8f]">In words: </span>
                <span className="italic text-[#16324f]">
                  {amountInWords(snapshot.paymentAmount, currency)}
                </span>
              </p>
            </section>

            {/* Settlement table */}
            <section>
              <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7c8f]">
                Settlement Summary
              </h3>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="border border-[#d7e0ea] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-[#6b7c8f]">
                      Particulars
                    </th>
                    <th className="border border-[#d7e0ea] px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-[#6b7c8f]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <SettlementRow label="Total Payable" value={formatMoney(snapshot.totalPayable)} />
                  <SettlementRow
                    label="Previously Paid"
                    value={formatMoney(snapshot.previouslyPaid)}
                  />
                  <SettlementRow label="This Payment" value={formatMoney(snapshot.thisPayment)} />
                  <SettlementRow
                    label="Remaining Due"
                    value={formatMoney(snapshot.remainingDue)}
                    emphasize
                  />
                </tbody>
              </table>
            </section>

            {/* Signature */}
            <section className="mt-2 grid grid-cols-2 gap-8">
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b97a1]">
                  Student acknowledgement
                </p>
                <div className="mt-10 border-b border-[#c8d4e0]" />
                <p className="m-0 mt-1.5 text-xs text-[#8b97a1]">Signature / Date</p>
              </div>
              <div className="text-right">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b97a1]">
                  Authorized
                </p>
                <p className="m-0 mt-3 text-sm font-semibold text-[#16324f]">{snapshot.receivedBy}</p>
                <div className="mt-6 border-b border-[#c8d4e0]" />
                <p className="m-0 mt-1.5 text-xs text-[#8b97a1]">Received by · Authorized signature</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-3">
            <p className="m-0 text-center text-[11px] leading-relaxed text-[#8b97a1]">
              This is a computer-generated official receipt. Please retain for your records.
              <br />
              For queries, contact the consultancy with Receipt No.{' '}
              <strong className="text-[#51657a]">{snapshot.receiptNumber}</strong>.
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
