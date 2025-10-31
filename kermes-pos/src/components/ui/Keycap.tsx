import React from 'react';
import { Box } from '@mui/material';

interface KeycapProps {
    children: React.ReactNode;
}

/**
 * Small inline keycap component to visually highlight keyboard keys
 * like Enter, Shift, Tab, Esc within sentences.
 */
const Keycap: React.FC<KeycapProps> = ({ children }) => (
    <Box
        component="span"
        sx={{
            display: 'inline-block',
            px: 0.75,
            py: 0.25,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            borderRadius: 1,
            fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'text.primary',
        }}
    >
        {children}
    </Box>
);

export default Keycap;
