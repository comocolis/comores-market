import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    if (body?.type === 'search') {
      const { error } = await supabase.rpc('log_search_history', {
        p_query: body.query,
        p_category_id: body.categoryId ?? null,
        p_island: body.island ?? null,
        p_results_count: body.resultsCount ?? null,
        p_visitor_id: body.visitorId ?? null,
      })

      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (body?.type === 'product_click') {
      const { error } = await supabase.rpc('log_product_click', {
        p_product_id: body.productId,
        p_source: body.source ?? 'unknown',
        p_visitor_id: body.visitorId ?? null,
      })

      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Événement invalide' }, { status: 400 })
  } catch (error) {
    console.error('Unable to persist personalization event', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde du signal' }, { status: 500 })
  }
}
