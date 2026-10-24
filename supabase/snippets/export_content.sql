-- Read-only. Run on live: returns one cell holding a script that makes another database's
-- page content (every section row + all of their stat items) match live.
-- Paste that cell's value into the local SQL editor and run it.
--
-- Sections are matched on `type` (inserted if missing); stat items are replaced wholesale and
-- keep live's ids, so nested rows stay attached. Images are matched on file_ref since file ids
-- differ between databases - a file live uses that isn't in the local `files` table keeps the
-- local section image, or leaves a stat item's image empty. People aren't included.
with recursive tree as (
    select si.id, 0 as depth
    from public.stat_items si
    where si.parent_id is null
    union all
    select child.id, tree.depth + 1
    from public.stat_items child
    join tree on child.parent_id = tree.id
),
file_lookup as (
    select id, format('(select id from public.files where file_ref = %L)', file_ref) as expr
    from public.files
),
sections_sql as (
    select string_agg(
        format(
            'insert into public.sections (type, heading, subheading, body, excerpt, sort_order, is_published, image_id) values (%L, %L, %L, %L, %L, %s, %L, %s) '
            'on conflict (type) do update set heading = excluded.heading, subheading = excluded.subheading, body = excluded.body, '
            'excerpt = excluded.excerpt, sort_order = excluded.sort_order, is_published = excluded.is_published, image_id = %s;',
            s.type, s.heading, s.subheading, s.body, s.excerpt, s.sort_order, s.is_published,
            coalesce(f.expr, 'null'),
            case
                when f.expr is null then 'null'
                else 'coalesce(excluded.image_id, public.sections.image_id)'
            end
        ),
        E'\n' order by s.sort_order
    ) as stmts
    from public.sections s
    left join file_lookup f on f.id = s.image_id
),
items_sql as (
    select string_agg(
        format(
            'insert into public.stat_items (id, label, value, style, description, sort_order, parent_id, image, section_id) values (%L, %L, %L, %L, %L, %s, %L, %s, (select id from public.sections where type = %L));',
            si.id, si.label, si.value, si.style, si.description, si.sort_order, si.parent_id,
            coalesce(f.expr, 'null'),
            s.type
        ),
        E'\n' order by tree.depth, s.sort_order, si.sort_order
    ) as stmts
    from public.stat_items si
    join tree on tree.id = si.id
    join public.sections s on s.id = si.section_id
    left join file_lookup f on f.id = si.image
)
select concat_ws(
    E'\n',
    '-- Content snapshot from live, taken ' || now()::text,
    'begin;',
    (select stmts from sections_sql),
    '-- nested rows go with their parents via on delete cascade',
    'delete from public.stat_items;',
    (select stmts from items_sql),
    'commit;'
) as sql;
