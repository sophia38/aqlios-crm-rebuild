'use client';

import { useEffect, useId, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import FormatAlignCenter from '@mui/icons-material/FormatAlignCenter';
import FormatAlignJustify from '@mui/icons-material/FormatAlignJustify';
import FormatAlignLeft from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRight from '@mui/icons-material/FormatAlignRight';
import FormatBold from '@mui/icons-material/FormatBold';
import FormatIndentDecrease from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncrease from '@mui/icons-material/FormatIndentIncrease';
import FormatItalic from '@mui/icons-material/FormatItalic';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import FormatListNumbered from '@mui/icons-material/FormatListNumbered';
import FormatStrikethrough from '@mui/icons-material/FormatStrikethrough';
import FormatUnderlined from '@mui/icons-material/FormatUnderlined';
import InsertLink from '@mui/icons-material/InsertLink';
import Redo from '@mui/icons-material/Redo';
import Undo from '@mui/icons-material/Undo';

export interface RichTextEditorProps {
  id?: string;
  label: string;
  required?: boolean;
  /** HTML. */
  value: string;
  /** Called with the HTML and its plain text (for counting and validation). */
  onChange: (html: string, text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Placeholder names without braces, e.g. `patient_name`; inserted as `{{patient_name}}`. */
  placeholders?: readonly string[];
  maxLength?: number;
  /** Ask AI isn't built yet (approved: shown disabled with "Coming soon"). */
  onAskAi?: () => void;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
}

const editorText = (editor: Editor) => editor.getText({ blockSeparator: '\n' }).trim();

/**
 * Message editor with the captured toolbar, Insert Placeholder menu, Ask AI and character counter
 * (COMPONENTS.md → RichTextEditor, docs/super-admin/10-template-library.md). Built on Tiptap.
 */
export function RichTextEditor({
  id,
  label,
  required = false,
  value,
  onChange,
  onBlur,
  placeholder,
  placeholders = [],
  maxLength,
  onAskAi,
  readOnly = false,
  error = false,
  helperText,
}: RichTextEditorProps) {
  const fallbackId = useId();
  const editorId = id ?? fallbackId;
  const labelId = `${editorId}-label`;
  const [placeholderAnchor, setPlaceholderAnchor] = useState<HTMLElement | null>(null);
  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: editorId,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        ...(required && { 'aria-required': 'true' }),
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML(), editorText(current)),
    onBlur: () => onBlur?.(),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive('bold'),
            italic: current.isActive('italic'),
            underline: current.isActive('underline'),
            strike: current.isActive('strike'),
            link: current.isActive('link'),
            bullet: current.isActive('bulletList'),
            ordered: current.isActive('orderedList'),
            align: (['left', 'center', 'right', 'justify'] as const).find((align) =>
              current.isActive({ textAlign: align }),
            ),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
            canSink: current.can().sinkListItem('listItem'),
            canLift: current.can().liftListItem('listItem'),
            length: editorText(current).length,
          }
        : null,
  });

  // Follow outside changes (e.g. the form resetting) without fighting the user's typing.
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  const length = state?.length ?? 0;
  const over = maxLength !== undefined && length > maxLength;

  const tool = (
    title: string,
    icon: React.ReactNode,
    run: (chain: ReturnType<Editor['chain']>) => void,
    options: { active?: boolean; disabled?: boolean } = {},
  ) => (
    <Tooltip title={title} key={title}>
      <span>
        <IconButton
          size="small"
          aria-label={title}
          aria-pressed={options.active === undefined ? undefined : options.active}
          disabled={!editor || options.disabled}
          onClick={() => editor && run(editor.chain().focus())}
          sx={(theme) => ({
            borderRadius: `${theme.tokens.radius.pickerItem}px`,
            color: options.active ? 'primary.main' : 'text.secondary',
            bgcolor: options.active ? theme.tokens.surface.tealLight : 'transparent',
          })}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  const separator = (key: string) => <Divider key={key} orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />;

  return (
    <Box>
      <Typography
        id={labelId}
        component="label"
        htmlFor={editorId}
        onClick={() => editor?.commands.focus()}
        sx={{ display: 'block', mb: 1, fontSize: 14, fontWeight: 500, color: error ? 'error.main' : 'text.primary' }}
      >
        {label}
        {required && (
          <Box component="span" aria-hidden sx={(theme) => ({ color: theme.tokens.text.asterisk, ml: 0.25 })}>
            *
          </Box>
        )}
      </Typography>
      <Box
        sx={(theme) => ({
          border: `1px solid ${error || over ? theme.palette.error.main : theme.tokens.border.field}`,
          borderRadius: `${theme.tokens.radius.input}px`,
          bgcolor: readOnly ? theme.tokens.neutral[50] : 'background.paper',
          transition: theme.transitions.create('border-color'),
          '&:focus-within': readOnly ? undefined : { borderColor: error || over ? 'error.main' : 'primary.main' },
          '& .tiptap': {
            minHeight: 140,
            px: 1.75,
            py: 1.5,
            fontSize: 14,
            color: readOnly ? 'text.secondary' : 'text.primary',
            outline: 'none',
            '& p': { m: 0 },
            '& ul, & ol': { my: 0, pl: 3 },
            '& a': { color: 'primary.main' },
          },
          '& .tiptap p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
        })}
      >
        {!readOnly && (
          <Stack
            direction="row"
            sx={(theme) => ({
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.25,
              px: 1,
              py: 0.5,
              borderBottom: `1px solid ${theme.tokens.border.medium}`,
            })}
          >
            <Stack
              role="toolbar"
              aria-label="Formatting"
              direction="row"
              sx={{ flexWrap: 'wrap', alignItems: 'center', flex: 1, gap: 0.25 }}
            >
              {tool('Bold', <FormatBold fontSize="small" />, (c) => c.toggleBold().run(), { active: state?.bold })}
              {tool('Italic', <FormatItalic fontSize="small" />, (c) => c.toggleItalic().run(), {
                active: state?.italic,
              })}
              {tool('Underline', <FormatUnderlined fontSize="small" />, (c) => c.toggleUnderline().run(), {
                active: state?.underline,
              })}
              {tool('Strikethrough', <FormatStrikethrough fontSize="small" />, (c) => c.toggleStrike().run(), {
                active: state?.strike,
              })}
              {separator('s1')}
              <Tooltip title="Link">
                <span>
                  <IconButton
                    size="small"
                    aria-label="Link"
                    aria-pressed={state?.link}
                    disabled={!editor}
                    onClick={(event) => {
                      setLinkUrl(editor?.getAttributes('link').href ?? '');
                      setLinkAnchor(event.currentTarget);
                    }}
                    sx={(theme) => ({
                      borderRadius: `${theme.tokens.radius.pickerItem}px`,
                      color: state?.link ? 'primary.main' : 'text.secondary',
                    })}
                  >
                    <InsertLink fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {separator('s2')}
              {tool('Align left', <FormatAlignLeft fontSize="small" />, (c) => c.setTextAlign('left').run(), {
                active: state?.align === 'left',
              })}
              {tool('Align center', <FormatAlignCenter fontSize="small" />, (c) => c.setTextAlign('center').run(), {
                active: state?.align === 'center',
              })}
              {tool('Align right', <FormatAlignRight fontSize="small" />, (c) => c.setTextAlign('right').run(), {
                active: state?.align === 'right',
              })}
              {tool('Justify', <FormatAlignJustify fontSize="small" />, (c) => c.setTextAlign('justify').run(), {
                active: state?.align === 'justify',
              })}
              {separator('s3')}
              {tool('Bulleted list', <FormatListBulleted fontSize="small" />, (c) => c.toggleBulletList().run(), {
                active: state?.bullet,
              })}
              {tool('Numbered list', <FormatListNumbered fontSize="small" />, (c) => c.toggleOrderedList().run(), {
                active: state?.ordered,
              })}
              {tool(
                'Decrease indent',
                <FormatIndentDecrease fontSize="small" />,
                (c) => c.liftListItem('listItem').run(),
                { disabled: !state?.canLift },
              )}
              {tool(
                'Increase indent',
                <FormatIndentIncrease fontSize="small" />,
                (c) => c.sinkListItem('listItem').run(),
                { disabled: !state?.canSink },
              )}
              {separator('s4')}
              {tool('Undo', <Undo fontSize="small" />, (c) => c.undo().run(), { disabled: !state?.canUndo })}
              {tool('Redo', <Redo fontSize="small" />, (c) => c.redo().run(), { disabled: !state?.canRedo })}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {placeholders.length > 0 && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddCircleOutline />}
                  aria-haspopup="menu"
                  onClick={(event) => setPlaceholderAnchor(event.currentTarget)}
                  disabled={!editor}
                  sx={{ fontWeight: 500 }}
                >
                  Insert Placeholder
                </Button>
              )}
              <Tooltip title="Coming soon">
                <span>
                  <Button
                    size="small"
                    startIcon={<AutoAwesomeOutlined />}
                    disabled={!onAskAi}
                    onClick={onAskAi}
                    sx={(theme) => ({
                      borderRadius: `${theme.tokens.radius.pill}px`,
                      px: 1.5,
                      color: 'text.primary',
                      border: '1.5px solid transparent',
                      background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, ${theme.tokens.template.aiGradient} border-box`,
                      '&.Mui-disabled': { color: 'text.secondary', opacity: 0.7 },
                    })}
                  >
                    Ask AI
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        )}
        <EditorContent editor={editor} />
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, mt: 0.5, px: 1.75 }}>
        <FormHelperText error={error || over} sx={{ m: 0 }}>
          {helperText}
        </FormHelperText>
        {maxLength !== undefined && (
          <FormHelperText error={over} sx={{ m: 0, whiteSpace: 'nowrap' }}>
            Character limit: {length}/{maxLength}
          </FormHelperText>
        )}
      </Stack>

      <Menu anchorEl={placeholderAnchor} open={Boolean(placeholderAnchor)} onClose={() => setPlaceholderAnchor(null)}>
        {placeholders.map((name) => (
          <MenuItem
            key={name}
            onClick={() => {
              setPlaceholderAnchor(null);
              editor?.chain().focus().insertContent(`{{${name}}}`).run();
            }}
            sx={{ fontSize: 14 }}
          >
            {`{{${name}}}`}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={Boolean(linkAnchor)}
        anchorEl={linkAnchor}
        onClose={() => setLinkAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack
          component="form"
          direction="row"
          spacing={1}
          sx={{ p: 1.5, alignItems: 'center' }}
          onSubmit={(event) => {
            event.preventDefault();
            const url = linkUrl.trim();
            const chain = editor?.chain().focus().extendMarkRange('link');
            if (url) chain?.setLink({ href: /^https?:\/\//i.test(url) ? url : `https://${url}` }).run();
            else chain?.unsetLink().run();
            setLinkAnchor(null);
          }}
        >
          <TextField
            size="small"
            label="Link address"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            autoFocus
            fullWidth={false}
            sx={{ width: 240 }}
          />
          <Button type="submit" variant="contained" size="small">
            Apply
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
}
