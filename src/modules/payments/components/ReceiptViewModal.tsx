import { Button, Modal, Spin } from 'antd'
import { useEffect } from 'react'
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

export default function ReceiptViewModal({ open, receiptId, onClose }: ReceiptViewModalProps) {
  const { data, isFetching, isError } = useGetReceiptQuery(receiptId || '', {
    skip: !open || !receiptId,
  })
  const snapshot = asSnapshot(data?.receipt.snapshot)

  useEffect(() => {
    if (!open) return
  }, [open])

  function printReceipt() {
    window.print()
  }

  function downloadReceipt() {
    if (!snapshot) return
    const lines = [
      `${snapshot.consultancyName || 'EDUCATION CONSULTANCY'} — PAYMENT RECEIPT`,
      `Receipt No: ${snapshot.receiptNumber}`,
      `Date: ${snapshot.paymentDate}`,
      `Student: ${snapshot.studentName}`,
      `Lead/File ID: ${snapshot.leadCode}`,
      `Payment For: ${snapshot.paymentFor}`,
      `Payment Amount: ${formatMoney(snapshot.paymentAmount)}`,
      `Payment Method: ${snapshot.paymentMethod}`,
      `Transaction ID: ${snapshot.transactionRef || '—'}`,
      `Total Payable: ${formatMoney(snapshot.totalPayable)}`,
      `Previously Paid: ${formatMoney(snapshot.previouslyPaid)}`,
      `This Payment: ${formatMoney(snapshot.thisPayment)}`,
      `Remaining Due: ${formatMoney(snapshot.remainingDue)}`,
      `Received By: ${snapshot.receivedBy}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${snapshot.receiptNumber || 'receipt'}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Payment Receipt"
      width={640}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button onClick={downloadReceipt} disabled={!snapshot}>
            Download
          </Button>
          <Button type="primary" onClick={printReceipt} disabled={!snapshot}>
            Print
          </Button>
        </div>
      }
    >
      {isFetching ? <Spin /> : null}
      {isError ? <p className="m-0 text-danger">Unable to load receipt.</p> : null}
      {snapshot ? (
        <div id="payment-receipt-print" className="grid gap-3 rounded-lg border border-[#e7eef5] p-5 text-sm">
          <h2 className="m-0 text-center text-base font-semibold tracking-wide text-[#17324f]">
            {(snapshot.consultancyName || 'EDUCATION CONSULTANCY').toUpperCase()} — PAYMENT RECEIPT
          </h2>
          <div className="flex flex-wrap justify-between gap-2">
            <span>Receipt No: <strong>{snapshot.receiptNumber}</strong></span>
            <span>Date: <strong>{snapshot.paymentDate}</strong></span>
          </div>
          <div className="grid gap-1">
            <p className="m-0">Student: <strong>{snapshot.studentName}</strong></p>
            <p className="m-0">Lead/File ID: <strong>{snapshot.leadCode}</strong></p>
            <p className="m-0">Payment For: <strong>{snapshot.paymentFor}</strong></p>
          </div>
          <div className="grid gap-1 border-t border-[#e7eef5] pt-3">
            <p className="m-0">Payment Amount: <strong>{formatMoney(snapshot.paymentAmount)}</strong></p>
            <p className="m-0">Payment Method: <strong>{snapshot.paymentMethod}</strong></p>
            <p className="m-0">Transaction ID: <strong>{snapshot.transactionRef || '—'}</strong></p>
          </div>
          <div className="grid gap-1 border-t border-[#e7eef5] pt-3">
            <p className="m-0">Total Payable: <strong>{formatMoney(snapshot.totalPayable)}</strong></p>
            <p className="m-0">Previously Paid: <strong>{formatMoney(snapshot.previouslyPaid)}</strong></p>
            <p className="m-0">This Payment: <strong>{formatMoney(snapshot.thisPayment)}</strong></p>
            <p className="m-0">Remaining Due: <strong>{formatMoney(snapshot.remainingDue)}</strong></p>
          </div>
          <p className="mb-0 mt-2">Received By: <strong>{snapshot.receivedBy}</strong></p>
        </div>
      ) : null}
    </Modal>
  )
}
