/**
 * GET /api/og/[id] — Branded OG share image for a post.
 *
 * Fixed three-section layout regardless of screenshot dimensions:
 *   Title bar : 52px
 *   Screenshot: 488px  (image is contained + centered; excess is letterboxed)
 *   Footer    : 90px
 *   ──────────────────
 *   Total     : 630px  (standard 1200×630 OG)
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const W = 1200;
const TITLEBAR_H = 52;
const FOOTER_H   = 90;
const IMG_H      = 630 - TITLEBAR_H - FOOTER_H; // 488

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: post } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) {
    return new Response('Post not found', { status: 404 });
  }

  const failLabel  = FAIL_LABELS[post.fail_type]  ?? post.fail_type;
  const agentLabel = AGENT_LABELS[post.agent]      ?? post.agent;
  const badge      = FAIL_BADGE[post.fail_type]    ?? FAIL_BADGE.other;
  const title      = post.title ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          width:         W,
          height:        630,
          background:    '#0d0d12',
          fontFamily:    'ui-sans-serif, system-ui, -apple-system, sans-serif',
          overflow:      'hidden',
        }}
      >
        {/* ── Title bar — fixed 52px ───────────────────────────────── */}
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
              marginLeft:  12,
              color:       '#666',
              fontSize:    15,
              fontFamily:  'monospace',
              whiteSpace:  'nowrap',
              overflow:    'hidden',
              textOverflow:'ellipsis',
            }}
          >
            {agentLabel} — session
          </span>
        </div>

        {/* ── Screenshot — fixed 488px, image letter-boxed inside ── */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           W,
            height:          IMG_H,
            flexShrink:      0,
            background:      '#111118',
            overflow:        'hidden',
          }}
        >
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt=""
              style={{
                width:     W,
                height:    IMG_H,
                objectFit: 'contain',
              }}
            />
          ) : (
            <span style={{ color: '#333', fontSize: 48 }}>🤦</span>
          )}
        </div>

        {/* ── Footer — fixed 90px ──────────────────────────────────── */}
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
            <span style={{ fontSize: 24 }}>🧑‍💻</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 22 }}>
              agentfails.wtf
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: 630 },
  );
}
