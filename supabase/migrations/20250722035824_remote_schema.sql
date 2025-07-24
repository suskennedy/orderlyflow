create policy "read 1ige2ga_0"
on "storage"."objects"
as permissive
for select
to public
using (true);


create policy "read policy  1ige2ga_0"
on "storage"."objects"
as permissive
for select
to public
using (true);


create policy "write   1ige2ga_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (true);


create policy "write   1ige2ga_1"
on "storage"."objects"
as permissive
for update
to authenticated
using (true);


create policy "write   1ige2ga_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (true);


create policy "write policy 1ige2ga_0"
on "storage"."objects"
as permissive
for update
to authenticated
using (true);


create policy "write policy 1ige2ga_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (true);


create policy "write policy 1ige2ga_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (true);



