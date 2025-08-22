-- Políticas para post_favorites
CREATE POLICY "Usuários podem favoritar posts" ON post_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus favoritos" ON post_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus favoritos" ON post_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para post_shares
CREATE POLICY "Usuários podem registrar compartilhamentos" ON post_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus compartilhamentos" ON post_shares
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para post_reports
CREATE POLICY "Usuários podem denunciar posts" ON post_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas denúncias" ON post_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para post_hidden
CREATE POLICY "Usuários podem ocultar posts" ON post_hidden
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver posts ocultos" ON post_hidden
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover posts ocultos" ON post_hidden
  FOR DELETE USING (auth.uid() = user_id);
