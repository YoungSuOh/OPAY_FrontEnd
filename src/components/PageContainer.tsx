import { ReactNode } from 'react'
import './PageContainer.css'

interface PageContainerProps {
  children: ReactNode
  title?: string
}

const PageContainer = ({ children, title }: PageContainerProps) => {
  return (
    <div className="page-container">
      {title && <h1 className="page-title">{title}</h1>}
      {children}
    </div>
  )
}

export default PageContainer
