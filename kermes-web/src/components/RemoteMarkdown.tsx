import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, CircularProgress, Alert } from '@mui/material';

interface RemoteMarkdownProps {
  url: string;
  style?: React.CSSProperties;
}

const RemoteMarkdown: React.FC<RemoteMarkdownProps> = ({ url, style }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch markdown');
        return res.text();
      })
      .then(setContent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">Error: {error}</Alert>;
  }
  return (
    <Box
      sx={(theme) => ({
        maxHeight: 500,
        overflowY: 'auto',
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(ellipse at top left, #23272f 60%, #181818 100%)'
          : 'radial-gradient(ellipse at top left, #fffbe7 60%, #f7f7f7 100%)',
        borderRadius: 3,
        p: { xs: 1.5, sm: 3 },
        fontSize: '1.07rem',
        boxShadow: 3,
        color: theme.palette.text.primary,
        transition: 'background 0.3s',
        ...style,
        // Markdown content theme-sensitive overrides
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontWeight: 600,
          marginTop: theme.spacing(2),
          color: theme.palette.text.primary,
        },
        '& hr': {
          border: 0,
          borderTop: `1.5px solid ${theme.palette.divider}`,
          margin: `${theme.spacing(2)} 0`,
        },
        '& pre': {
          background: theme.palette.mode === 'dark' ? '#23272f' : '#f5f5f5',
          padding: theme.spacing(1.5),
          borderRadius: theme.shape.borderRadius,
          overflowX: 'auto',
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.97em',
          color: theme.palette.mode === 'dark' ? '#ffecb3' : '#b26a00',
          background: theme.palette.mode === 'dark' ? '#23272f' : '#f5f5f5',
          borderRadius: 2,
          padding: '0.15em 0.4em',
        },
        '& ul, & ol': {
          paddingLeft: theme.spacing(3),
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          margin: `${theme.spacing(2)} 0`,
        },
        '& th, & td': {
          border: `1px solid ${theme.palette.divider}`,
          padding: theme.spacing(1),
        },
        '& input[type="checkbox"]': {
          accentColor: theme.palette.primary.main,
          filter: theme.palette.mode === 'dark' ? 'brightness(0.8)' : 'none',
        },
      })}
      data-testid="remote-markdown"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};

export default RemoteMarkdown;
