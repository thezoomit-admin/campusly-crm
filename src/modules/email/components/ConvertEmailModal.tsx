import { useEffect, useMemo, useState } from 'react'
import { Input, Modal, Segmented, Select } from 'antd'
import { useDebounce } from '@/hooks/useDebounce'
import { useListLeadsQuery } from '@/modules/leads/api/leadsApi'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import type { EmailThread } from '../types'

export type ConvertValues = {
  leadId?: string
  name?: string
  preferredCountryCode?: string
  notes?: string
}

type Props = {
  open: boolean
  thread: EmailThread | null
  saving?: boolean
  errors?: Record<string, string>
  onClose: () => void
  onSubmit: (values: ConvertValues) => void
}

export default function ConvertEmailModal({ open, thread, saving, errors = {}, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [name, setName] = useState('')
  const [country, setCountry] = useState<string | undefined>()
  const [notes, setNotes] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadId, setLeadId] = useState<string | undefined>()
  const debouncedSearch = useDebounce(leadSearch, 300)

  const { data: countries } = useListMasterDataOptionsQuery({ category: 'COUNTRY' }, { skip: !open })
  const { data: leads, isFetching: leadsLoading } = useListLeadsQuery(
    { search: debouncedSearch, limit: 20 },
    { skip: !open || mode !== 'link' || debouncedSearch.trim().length < 2 },
  )

  useEffect(() => {
    if (!open) return
    setMode('create')
    setName(thread?.contactName || '')
    setCountry(undefined)
    setNotes('')
    setLeadSearch('')
    setLeadId(undefined)
  }, [open, thread?.contactName])

  const countryOptions = useMemo(
    () =>
      (countries?.items || [])
        .filter((item) => item.code)
        .map((item) => ({ value: item.code as string, label: item.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries?.items],
  )

  const leadOptions = (leads?.items || []).map((lead) => ({
    value: lead.id,
    label: `${lead.code ? `${lead.code} — ` : ''}${lead.name}${lead.email ? ` · ${lead.email}` : ''}`,
  }))

  const canSubmit = mode === 'link' ? Boolean(leadId) : Boolean(name.trim())

  function submit() {
    if (!canSubmit) return
    if (mode === 'link') onSubmit({ leadId })
    else
      onSubmit({
        name: name.trim(),
        preferredCountryCode: country,
        notes: notes.trim() || undefined,
      })
  }

  return (
    <Modal
      title="Create lead from email"
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={mode === 'link' ? 'Link lead' : 'Create lead'}
      okButtonProps={{ disabled: !canSubmit }}
      confirmLoading={saving}
      width={520}
    >
      <div className="mt-3 grid gap-3">
        <p className="m-0 text-[0.82rem] text-text-muted">
          Sender <strong className="text-text-strong">{thread?.participantEmail}</strong> will be saved on the lead.
          The same email address will not create a second lead.
        </p>
        <Segmented
          block
          value={mode}
          onChange={(value) => setMode(value as 'create' | 'link')}
          options={[
            { value: 'create', label: 'Create new lead' },
            { value: 'link', label: 'Link existing lead' },
          ]}
        />
        {mode === 'create' ? (
          <>
            <label className="grid gap-1.5">
              <span className="text-[0.85rem] font-medium">
                Student name <span className="text-danger">*</span>
              </span>
              <Input value={name} onChange={(e) => setName(e.target.value)} status={errors.name ? 'error' : undefined} />
              {errors.name ? <span className="text-[0.78rem] text-danger">{errors.name}</span> : null}
            </label>
            <label className="grid gap-1.5">
              <span className="text-[0.85rem] font-medium">Preferred country</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={country}
                onChange={setCountry}
                options={countryOptions}
                placeholder="Used for country-based assignment"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[0.85rem] font-medium">Notes</span>
              <Input.TextArea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </>
        ) : (
          <label className="grid gap-1.5">
            <span className="text-[0.85rem] font-medium">Lead</span>
            <Select
              showSearch
              filterOption={false}
              value={leadId}
              onChange={setLeadId}
              onSearch={setLeadSearch}
              loading={leadsLoading}
              options={leadOptions}
              placeholder="Search by name, code, or email"
              notFoundContent={debouncedSearch.trim().length < 2 ? 'Type at least 2 characters' : undefined}
            />
          </label>
        )}
      </div>
    </Modal>
  )
}
