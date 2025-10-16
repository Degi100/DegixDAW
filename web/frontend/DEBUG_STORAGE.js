// DEBUG: Storage Issues
// Füge diesen Code in die Browser Console ein (F12)

// 1. Prüfe Supabase Client Config
console.log('=== SUPABASE CONFIG ===');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// 2. Prüfe Auth Session
const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('=== AUTH SESSION ===');
  console.log('Logged in:', !!session);
  console.log('User ID:', session?.user?.id);
  console.log('Has JWT:', !!session?.access_token);
  return session;
};

// 3. Prüfe Message Attachments
const checkAttachments = async () => {
  const { data, error } = await supabase
    .from('message_attachments')
    .select('id, file_name, file_url, thumbnail_url')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('=== MESSAGE ATTACHMENTS ===');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Count:', data?.length);
    data?.forEach((att, i) => {
      console.log(`\n[${i+1}] ${att.file_name}`);
      console.log('  file_url:', att.file_url);
      console.log('  Is full URL:', att.file_url.startsWith('http'));
      console.log('  Is path:', !att.file_url.startsWith('http'));
    });
  }
  return data;
};

// 4. Test Signed URL Generation
const testSignedUrl = async (storagePath) => {
  console.log('=== TESTING SIGNED URL ===');
  console.log('Input path:', storagePath);

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error('Error:', error);
    console.log('Error details:', {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode
    });
  } else {
    console.log('Success!');
    console.log('Signed URL:', data.signedUrl);
    console.log('\n→ Teste URL im neuen Tab:');
    console.log(data.signedUrl);

    // Öffne URL automatisch
    window.open(data.signedUrl, '_blank');
  }

  return data;
};

// 5. Prüfe Bucket Config
const checkBucket = async () => {
  console.log('=== BUCKET CONFIG ===');
  const { data, error } = await supabase.storage.getBucket('chat-attachments');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Bucket name:', data.name);
    console.log('Is public:', data.public);
    console.log('Max file size:', (data.file_size_limit / 1024 / 1024).toFixed(2), 'MB');
  }

  return data;
};

// 6. RUN ALL CHECKS
const runAllChecks = async () => {
  console.clear();
  console.log('🔍 STORAGE DEBUG SCRIPT\n');

  const session = await checkAuth();
  if (!session) {
    console.error('❌ Not logged in! Log in first.');
    return;
  }

  await checkBucket();
  const attachments = await checkAttachments();

  if (attachments && attachments.length > 0) {
    const firstPath = attachments[0].file_url;
    if (!firstPath.startsWith('http')) {
      console.log('\n📝 Testing first file...');
      await testSignedUrl(firstPath);
    } else {
      console.log('\n⚠️  file_url is still a full URL, not a storage path!');
      console.log('   Need to run DB migration first.');
    }
  }

  console.log('\n✅ Debug complete!');
};

// AUTO-RUN
console.log('💡 Run: await runAllChecks()');
console.log('💡 Or manually: await testSignedUrl("path/to/file.jpg")');

// Export für manuelle Nutzung
window.debugStorage = {
  checkAuth,
  checkAttachments,
  testSignedUrl,
  checkBucket,
  runAllChecks
};
