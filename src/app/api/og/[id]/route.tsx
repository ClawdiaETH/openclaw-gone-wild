/**
 * GET /api/og/[id] — Branded OG share image for a post.
 *
 * Layout (1200×630):
 *   Title bar : 52px
 *   Screenshot: 488px  (image contained + letterboxed)
 *   Footer    : 90px
 *
 * Performance:
 *  - Fonts loaded from bundled TTF files via fs.readFileSync (no network call)
 *  - Screenshot fetched server-side with 5s timeout → base64 data URL
 *    (avoids Satori's slow internal fetch + any CORS issues)
 */

import { ImageResponse } from 'next/og';
import { createClient }  from '@supabase/supabase-js';
import { NextRequest }   from 'next/server';
import path              from 'path';
import fs                from 'fs';

export const dynamic = 'force-dynamic';

// ── Fonts (loaded once, cached in module scope) ───────────────────────────────

let _fontRegular: ArrayBuffer | null = null;
let _fontBold:    ArrayBuffer | null = null;

function loadFonts(): { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] {
  try {
    if (!_fontRegular) {
      const p = path.join(process.cwd(), 'public', 'fonts', 'inter-400.ttf');
      _fontRegular = fs.readFileSync(p).buffer as ArrayBuffer;
    }
    if (!_fontBold) {
      const p = path.join(process.cwd(), 'public', 'fonts', 'inter-700.ttf');
      _fontBold = fs.readFileSync(p).buffer as ArrayBuffer;
    }
    return [
      { name: 'Inter', data: _fontRegular!, weight: 400, style: 'normal' },
      { name: 'Inter', data: _fontBold!,    weight: 700, style: 'normal' },
    ];
  } catch (e) {
    console.error('[og] font load failed:', e);
    return [];
  }
}

// ── Image helper ──────────────────────────────────────────────────────────────

/** Fetch an image and return it as a base64 data URL with a 5s timeout. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = res.headers.get('content-type') ?? 'image/jpeg';
    const b64  = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FAIL_LABELS: Record<string, string> = {
  hallucination: '🏜️ Hallucination',
  confident:     '🫡 Confidently Wrong',
  loop:          '♾️ Infinite Loop',
  apology:       '🙏 Apology Loop',
  uno_reverse:   '🔄 Uno Reverse',
  unhinged:      '🤪 Just Unhinged',
  other:         '🤷 Other',
};

const AGENT_LABELS: Record<string, string> = {
  openclaw: '🦞 OpenClaw',
  claude:   '🤖 Claude',
  chatgpt:  '💚 ChatGPT',
  gemini:   '💙 Gemini',
  grok:     '🦅 Grok',
  other:    '🤖 Other AI',
};

const FAIL_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  hallucination: { bg: 'rgba(220,60,40,0.2)',  color: '#e87060', border: 'rgba(220,60,40,0.45)'  },
  confident:     { bg: 'rgba(200,160,30,0.2)', color: '#d4aa30', border: 'rgba(200,160,30,0.45)' },
  loop:          { bg: 'rgba(50,180,100,0.2)', color: '#50c878', border: 'rgba(50,180,100,0.45)' },
  apology:       { bg: 'rgba(120,60,220,0.2)', color: '#a070e8', border: 'rgba(120,60,220,0.45)' },
  uno_reverse:   { bg: 'rgba(180,50,180,0.2)', color: '#d060d0', border: 'rgba(180,50,180,0.45)' },
  unhinged:      { bg: 'rgba(220,60,40,0.2)',  color: '#e87060', border: 'rgba(220,60,40,0.45)'  },
  other:         { bg: 'rgba(80,80,100,0.2)',  color: '#9090b0', border: 'rgba(80,80,100,0.45)'  },
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────

const W = 1200, H = 630, TITLEBAR_H = 52, IMG_H = 488, FOOTER_H = 90;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: post } = await getSupabaseAdmin()
    .from('posts')
    .select('id, title, image_url, agent, fail_type, upvote_count')
    .eq('id', id)
    .single();

  if (!post) return new Response('Post not found', { status: 404 });

  const failLabel  = FAIL_LABELS[post.fail_type]  ?? post.fail_type;
  const agentLabel = AGENT_LABELS[post.agent]      ?? post.agent;
  const badge      = FAIL_BADGE[post.fail_type]    ?? FAIL_BADGE.other;
  const title      = post.title ?? '';

  // Fetch screenshot as data URL in parallel with font load (both are fast)
  const [fonts, imgSrc] = await Promise.all([
    Promise.resolve(loadFonts()),
    post.image_url ? toDataUrl(post.image_url) : Promise.resolve(null),
  ]);

  const fontFamily = fonts.length > 0 ? 'Inter' : 'system-ui, sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          width:         W,
          height:        H,
          background:    '#0d0d12',
          fontFamily,
          overflow:      'hidden',
        }}
      >
        {/* ── Title bar ── */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            width:        W,
            height:       TITLEBAR_H,
            flexShrink:   0,
            background:   '#080810',
            borderBottom: '1px solid #1e1e2e',
            padding:      '0 20px',
            gap:          8,
          }}
        >
          <div style={{ width: 13, height: 13, borderRadius: 999, background: '#ff5f57' }} />
          <div style={{ width: 13, height: 13, borderRadius: 999, background: '#ffbd2e', marginLeft: 5 }} />
          <div style={{ width: 13, height: 13, borderRadius: 999, background: '#28c840', marginLeft: 5 }} />
          <span
            style={{
              marginLeft:   12,
              color:        '#666',
              fontSize:     14,
              fontFamily:   'monospace',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {agentLabel} — session
          </span>
        </div>

        {/* ── Screenshot ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          W,
            height:         IMG_H,
            flexShrink:     0,
            background:     '#111118',
            overflow:       'hidden',
          }}
        >
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt=""
              style={{ width: W, height: IMG_H, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: '#444', fontSize: 72 }}>🤦</span>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            width:          W,
            height:         FOOTER_H,
            flexShrink:     0,
            background:     '#0d0d12',
            borderTop:      '1px solid #1e1e2e',
            padding:        '0 24px',
          }}
        >
          {/* Left: title + badges */}
          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           8,
              flex:          1,
              minWidth:      0,
              overflow:      'hidden',
            }}
          >
            {title ? (
              <span
                style={{
                  color:        '#f0f0f0',
                  fontWeight:   700,
                  fontSize:     17,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background:   badge.bg,
                  color:        badge.color,
                  border:       `1px solid ${badge.border}`,
                  borderRadius: 999,
                  padding:      '4px 12px',
                  fontSize:     12,
                  fontWeight:   700,
                  whiteSpace:   'nowrap',
                }}
              >
                {failLabel}
              </span>
              <span
                style={{
                  background:   'rgba(255,255,255,0.05)',
                  color:        '#777',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 999,
                  padding:      '4px 12px',
                  fontSize:     12,
                  whiteSpace:   'nowrap',
                }}
              >
                {agentLabel}
              </span>
            </div>
          </div>

          {/* Right: branding */}
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              flexShrink: 0,
              marginLeft: 32,
            }}
          >
            <span style={{ fontSize: 22 }}>💀</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 20, fontFamily }}>
              agentfails.wtf
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  );
}
