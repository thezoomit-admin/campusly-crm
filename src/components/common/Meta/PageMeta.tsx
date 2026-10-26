import { Helmet } from 'react-helmet-async'
import { useWorkspaceBrand } from '@/modules/settings/hooks/useWorkspaceBrand'

export const PAGE_TITLE_SUFFIX = ' | EduConsult CRM'
const MAX_DESCRIPTION_LENGTH = 160

function truncateDescription(text: string, appName: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return `${appName} — education consultancy management platform.`
  }
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
}

function buildDocumentTitle(title: string, appName: string) {
  const trimmed = title.trim()
  const suffix = ` | ${appName}`
  if (!trimmed || trimmed === appName) {
    return appName
  }
  if (trimmed.endsWith(suffix) || trimmed.endsWith(PAGE_TITLE_SUFFIX)) {
    return trimmed
  }
  return `${trimmed}${suffix}`
}

const PageMeta = ({
  title,
  description,
}: {
  title: string
  description: string
}) => {
  const { name } = useWorkspaceBrand()
  const documentTitle = buildDocumentTitle(title, name)
  const metaDescription = truncateDescription(description, name)

  return (
    <Helmet>
      <title>{documentTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={metaDescription} />
    </Helmet>
  )
}

export default PageMeta
