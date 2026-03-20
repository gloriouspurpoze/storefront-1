import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BlogEditor } from '../../components/blog/BlogEditor'

/**
 * Full-page blog editor for CMS. Routes:
 * - /cms/blogs/new — create
 * - /cms/blogs/:postId/edit — edit
 */
export default function BlogEditorPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  return (
    <BlogEditor
      postId={postId ?? null}
      onCancel={() => navigate('/cms/blogs')}
      onSaved={() => navigate('/cms/blogs')}
    />
  )
}
