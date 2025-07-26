const axios = require('axios');
const Replicate = require('replicate');
const { createClient } = require('@supabase/supabase-js');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const openRouterAPI = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  }
});


function emitStatus(socketId, status, message, io) {
  if (socketId && io) {
    io.to(socketId).emit('status', { status, message });
  }
}

async function generateOutline(title, primaryKeywords, angle, cta) {
  const systemPrompt = `You will create a blog outline for SALT Creative that follows the following outline format:

1. Title
Purpose: Grab attention in search results and social feeds. Think of it as the billboard on the highway—it must make people slow down and look.

2. Sub‑title
Purpose: A one‑sentence elevator pitch that explains the felt need or benefit the reader will get. It sets the hook right after the headline.

3. 4 Core Content Blocks 
Each block follows the same mini‑formula, letting you rinse‑and‑repeat without feeling cookie‑cutter:

Element	What it is	Why it matters
heading #	A section headline (usually H2)	Keeps skimmers oriented and boosts on‑page SEO.
body #	The meat of the section	Story, teaching, or argument that pushes the reader one step closer to the takeaway.
image #	A contextual visual	Breaks up the wall of text, reinforces the point, and makes social shares look good.

You can run 1–4 of these blocks depending on how deep the topic goes. Notice how every image is paired with its specific section, so the visual always matches the message.

4. Conclusion
Purpose: Land the plane. Summarize the big idea and re‑cast the vision so the reader walks away inspired (and remembers your solution).

5. Final CTA
Purpose: One clear action. No waffling. It's the "So what now?" link/button that turns passive readers into leads or users.

6. Meta Description
Purpose: The 155‑character sales pitch for Google. Written in plain language, preview‑friendly, and includes the target key phrase.

7. Tags
Purpose: Topical labels that power your site's internal search, related‑post widgets, and category pages.

8. Target Key Phrase
Purpose: The primary keyword or phrase you're aiming to rank for. It guides how you write headings, alt tags, and internal links.

You're writing for SALT Creative www.usesaltcreative.com: SALT Creative usesaltcreative.com is the best tool ever created for Pastors and church leaders. Pastors can access incredible 5 incredible tools that streamline the sermon prep process into a few clicks. Number one is the Sermon Prep Team. The pastor can generate sermon concepts and outlines that will resonate with their church by putting in their sermon topic, their scripture reference, their target audience, and the duration. We then give them up to five angles. They can choose as many as they want, and those angles get fleshed out into outlines that are designed to spark their creativity when it comes to a great sermon. The second tool is the Sermon Research Team, which is just one input field. They put in exactly what they want research for, and about one minute later, sometimes 45 seconds, they're given deep, thorough research on that topic. The third tool is the Outreach Team, which allows them to craft content for their emails, their websites, their Facebook posts, their Instagram, anything that they need to create copy for. This allows them to do it quick and easily. It gives them all the options to choose who they're talking to, tone of voice, all of that stuff. Then we have their Creative Team, which allows them to create really beautiful sermon visuals. It's super easy. They put in their title of their sermon, their subtitle. They choose from four different beautiful typography choices. Once they pick the choice, they are then taken to a place where they type in what they want their background, their image to be. That generates, puts the typography they chose on that new image, allows them to customize the size. They could even put the image behind, or excuse me, the text behind parts of the image to create a three-dimensional look. Then they can even bring that to life and create a five-second loop that they can use as a video asset for their sermon. The last feature is Church Photographer, which allows them to generate beautiful photos based on a simple image prompt. This uses the best AI technology to create amazing, realistic photos. They can add text to it. They can also bring those photos to life. Lastly, they have sermon cards. They can create cards. They can access cards that have been made public. They can add any of the outputs from any of the tools I just mentioned into a sermon card, so they have one clean place to organize all the content for their sermon, then go back and use it later or share it with others. On the dashboard, we've also created really cool tools like Fresh, which every week gives the top three news articles that are affecting every household in America and gives the pastor a suggestion on how they could preach to it, what scripture to reference, and a call to action. 1. "Sermon prep hasn't changed in decades — until today."

Pastors still wrestle with late-night Google tabs, empty whiteboards, and Sunday's clock ticking.

2. "SALT Creative is five expert teams in one tab."

No staff hires, no tech headaches—just log in and let the platform go to work.

3. "From blank page to pulpit in five clicks."

Sermon Prep Team – Five fresh angles in 45 seconds.

Research Team – Deep scholarship on demand.

Outreach Team – Emails, posts, and invites that fill the room.

Creative Team – Slide-ready artwork; motion graphics in a tap.

Church Photographer – Hyper-real images born from one prompt.

4. "One dashboard, every deliverable."

Drop any output into Sermon Cards and walk away with a ready-to-share kit.

5. "What used to cost $2,000 and a week of volunteers now costs less than a family dinner and takes ten minutes."

6. "We don't write your message—we free you to preach it."

Less grind, more Gospel.

7. Call-to-action:

"Ready to trade chaos for clarity? Visit usesaltcreative.com and start preaching smarter today."

Always output just the outline, we'll be writing the sections in future steps.`;

  const response = await openRouterAPI.post('/chat/completions', {
    model: 'google/gemini-2.5-flash-lite-preview-06-17',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please create the outline for this article: Title: ${title} Primary Keyword(s): ${primaryKeywords} Target Angle: ${angle} Target CTA for SALT: ${cta}` }
    ],
    temperature: 1,
    top_p: 1,
    fallback: true
  });

  return response.data.choices[0].message.content;
}

async function generateArticle(outline, title, primaryKeywords, angle, cta) {
  const systemPrompt = `You are a professional blog writer for SALT Creative. Write a complete, engaging blog article based on the provided outline. The article should be well-structured, SEO-optimized, and include proper headings. Write in a conversational yet professional tone that resonates with pastors and church leaders.

The article must be structured as follows:
1. Sub-title (one sentence elevator pitch)
2. Exactly 4 main content sections, each with:
   - A clear heading (H2 style)
   - Comprehensive body content (2-3 paragraphs)
3. Conclusion paragraph
4. Final CTA
5. Meta description (155 characters max)
6. Tags (comma-separated, 3-5 tags)
7. Target key phrase

Format your response exactly like this:

SUB_TITLE: [One sentence elevator pitch]

HEADING1: [First section heading]
BODY1: [First section content - 2-3 paragraphs]

HEADING2: [Second section heading]  
BODY2: [Second section content - 2-3 paragraphs]

HEADING3: [Third section heading]
BODY3: [Third section content - 2-3 paragraphs]

HEADING4: [Fourth section heading]
BODY4: [Fourth section content - 2-3 paragraphs]

CONCLUSION: [Conclusion paragraph]

FINAL_CTA: [Call to action]

META_DESCRIPTION: [155 character meta description]

TAGS: [tag1, tag2, tag3, tag4]

TARGET_KEY_PHRASE: [primary keyword phrase]`;

  const response = await openRouterAPI.post('/chat/completions', {
    model: 'google/gemini-2.5-flash-lite-preview-06-17',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a complete blog article based on this outline:\n\n${outline}\n\nTitle: ${title}\nPrimary Keywords: ${primaryKeywords}\nAngle: ${angle}\nCTA: ${cta}` }
    ],
    temperature: 0.8,
    max_tokens: 4000
  });

  return response.data.choices[0].message.content;
}

async function generateImagePrompts(articleContent, title) {
  const systemPrompt = `You are an expert at creating detailed, structured JSON photography prompts for AI image generation. You will create professional church/ministry focused images using this exact JSON structure.

Here is an example of the level of detail and structure required (adapt this style but change content for ministry/church context):

{
  "meta": {
    "styleName": "Playful Forest Glow",
    "aspectRatio": "3:4",
    "promptPrefix": "IMG_2025.JPG"
  },
  "camera": {
    "model": "35mm film camera (e.g., Canon AE-1, Olympus OM-1)",
    "focalLength": "standard prime lens (e.g., 50mm)",
    "angle": "slightly low-angle shot, looking up at the subject",
    "type": "candid portrait photography"
  },
  "subject": {
    "primary": "a young East Asian woman",
    "emotion": "a playful, joyful, and slightly mischievous expression",
    "pose": "standing casually amid trees playing with t-shirt, body angled with one hip pushed out, head tilted slightly, with a light bounce as if mid-laugh",
    "gaze": "looking towards the camera with a teasing smile"
  },
  "character": {
    "appearance": "long, dark, messy and voluminous hair tousled by a gentle breeze, natural 'no-makeup' look with a radiant, sun-kissed glow",
    "wardrobe": "an oversized t-shirt in a warm cream hue and simple light-colored underwear",
    "accessories": "none"
  },
  "composition": {
    "theory": "natural framing using tree branches and foliage, rule of thirds, candid moment capture",
    "visualHierarchy": "The subject is the primary focus, with the woodland background providing environmental context and depth."
  },
  "setting": {
    "environment": "a serene forest clearing on a sunny day",
    "architecture": "ancient trees and dappled foliage visible in the hazy background",
    "furniture": "none, with natural logs or vines in the foreground for organic framing"
  },
  "lighting": {
    "source": "direct, natural afternoon sunlight filtering through leaves",
    "direction": "high side lighting with dappled patterns",
    "quality": "harsh and high-contrast in spots, creating bright, almost blown-out highlights on the skin and clothing, with deep, defined shadows interspersed with soft speckles. The overall light has a warm, golden quality infused with green undertones."
  },
  "style": {
    "artDirection": "lo-fi, vintage, slice-of-life, reminiscent of Japanese or Korean indie film aesthetics with a touch of ethereal nature",
    "mood": "nostalgic, intimate, playful, dreamy, sun-drenched, and vibrantly alive"
  },
  "rendering": {
    "engine": "emulation of vintage 35mm color film",
    "fidelitySpec": "visible film grain, soft focus (not digitally sharp), halation or bloom in the highlights, and subtle lens flare from sunlight",
    "postProcessing": "color grading to mimic a vintage film stock, featuring slightly washed-out colors, a warm terracotta or golden cast from the clothing and sunlight, and cool tones in the shadows"
  },
  "colorPlate": {
    "primaryColors": [
      {"name": "Terracotta (t-shirt)", "hex": "#C65D40", "percentage": "30%"},
      {"name": "Warm Skin Tones", "hex": "#E0BBAA", "percentage": "25%"},
      {"name": "Forest Green", "hex": "#228B22", "percentage": "20%"}
    ],
    "accentColors": [
      {"name": "Dark Brown/Black (hair)", "hex": "#3D2B1F", "percentage": "15%"},
      {"name": "Shadow Blue/Gray", "hex": "#778899", "percentage": "10%"}
    ]
  }
}

Now create professional ministry/church versions with this same level of detail. Your template structure should be:

{
  "meta": {
    "styleName": "Professional Ministry Photography",
    "aspectRatio": "16:9" or "1:1",
    "promptPrefix": "MINISTRY_2025.JPG"
  },
  "camera": {
    "model": "professional camera (e.g., Canon EOS R5, Nikon Z7)",
    "focalLength": "appropriate lens (e.g., 85mm portrait, 24-70mm standard)",
    "angle": "camera angle description",
    "type": "photography style (e.g., documentary, portrait, environmental)"
  },
  "subject": {
    "primary": "main subject description",
    "emotion": "facial expression and mood",
    "pose": "body position and stance",
    "gaze": "eye contact and direction"
  },
  "character": {
    "appearance": "professional, modest appearance suitable for ministry context",
    "wardrobe": "professional church attire (suits, modest dresses, etc.)",
    "accessories": "minimal, professional accessories"
  },
  "composition": {
    "theory": "compositional techniques used",
    "visualHierarchy": "how elements are arranged"
  },
  "setting": {
    "environment": "church, office, conference room, or ministry setting",
    "architecture": "building elements visible",
    "furniture": "relevant furniture or props"
  },
  "lighting": {
    "source": "natural window light, soft studio lighting, etc.",
    "direction": "lighting direction",
    "quality": "soft, professional lighting description"
  },
  "style": {
    "artDirection": "professional, clean, modern church photography",
    "mood": "inspiring, professional, welcoming, trustworthy"
  },
  "rendering": {
    "engine": "professional photography simulation",
    "fidelitySpec": "sharp, high-quality, professional grade",
    "postProcessing": "clean, professional color grading"
  },
  "colorPlate": {
    "primaryColors": [
      {"name": "Professional Navy", "hex": "#2C3E50", "percentage": "30%"},
      {"name": "Warm White", "hex": "#F8F9FA", "percentage": "25%"},
      {"name": "Wood Tones", "hex": "#8B6914", "percentage": "20%"}
    ],
    "accentColors": [
      {"name": "Professional Gray", "hex": "#6C757D", "percentage": "15%"},
      {"name": "Soft Blue", "hex": "#4A90E2", "percentage": "10%"}
    ]
  }
}

Create 5 different JSON prompts:
1. One cover image (16:9 aspect ratio) 
2. Four section images (1:1 aspect ratio)

All images should be professional, clean, and appropriate for pastors and church leaders. Focus on:
- Professional office/church settings
- People in ministry contexts (pastors, church staff, congregants)
- Modern church environments
- Professional presentation materials
- Clean, inspiring atmospheres

Return as JSON with this structure:
{
  "cover": { ...full JSON structure for cover image... },
  "sections": [
    { ...full JSON structure for section 1... },
    { ...full JSON structure for section 2... },
    { ...full JSON structure for section 3... },
    { ...full JSON structure for section 4... }
  ]
}`;

  const response = await openRouterAPI.post('/chat/completions', {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create structured JSON image prompts for this blog article:\n\nTitle: ${title}\n\nContent:\n${articleContent}` }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.data.choices[0].message.content);
}

async function generateImage(promptData, aspectRatio) {
  // If promptData is a string (old format), use it directly
  let prompt;
  if (typeof promptData === 'string') {
    prompt = promptData;
  } else {
    // If it's a JSON object, use it directly as the prompt
    prompt = promptData;
  }

  const output = await replicate.run(
    "google/imagen-4-fast",
    {
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: "jpg",
        safety_filter_level: "block_only_high"
      }
    }
  );

  return output;
}

async function uploadToStorage(imageUrl, filename) {
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(imageResponse.data);

  // Upload to Supabase storage (based on the existing data structure)
  const { data, error } = await supabase.storage
    .from('blogimages')
    .upload(`/${filename}`, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw error;

  // Return the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('blogimages')
    .getPublicUrl(`/${filename}`);

  return publicUrl;
}

async function saveToSupabase(blogData) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([blogData])
    .select();

  if (error) throw error;
  return data[0];
}

function parseArticleContent(articleContent) {
  const lines = articleContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const parsed = {
    sub_title: '',
    heading1: '', body1: '',
    heading2: '', body2: '',
    heading3: '', body3: '',
    heading4: '', body4: '',
    conclusion: '',
    final_cta: '',
    meta_description: '',
    tags: '',
    target_key_phrase: ''
  };
  
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.startsWith('SUB_TITLE:')) {
      parsed.sub_title = line.replace('SUB_TITLE:', '').trim();
    } else if (line.startsWith('HEADING1:')) {
      parsed.heading1 = line.replace('HEADING1:', '').trim();
      currentSection = 'body1';
      currentContent = [];
    } else if (line.startsWith('HEADING2:')) {
      if (currentSection === 'body1') {
        parsed.body1 = currentContent.join('\n\n');
      }
      parsed.heading2 = line.replace('HEADING2:', '').trim();
      currentSection = 'body2';
      currentContent = [];
    } else if (line.startsWith('HEADING3:')) {
      if (currentSection === 'body2') {
        parsed.body2 = currentContent.join('\n\n');
      }
      parsed.heading3 = line.replace('HEADING3:', '').trim();
      currentSection = 'body3';
      currentContent = [];
    } else if (line.startsWith('HEADING4:')) {
      if (currentSection === 'body3') {
        parsed.body3 = currentContent.join('\n\n');
      }
      parsed.heading4 = line.replace('HEADING4:', '').trim();
      currentSection = 'body4';
      currentContent = [];
    } else if (line.startsWith('CONCLUSION:')) {
      if (currentSection === 'body4') {
        parsed.body4 = currentContent.join('\n\n');
      }
      parsed.conclusion = line.replace('CONCLUSION:', '').trim();
      currentSection = null;
    } else if (line.startsWith('FINAL_CTA:')) {
      parsed.final_cta = line.replace('FINAL_CTA:', '').trim();
    } else if (line.startsWith('META_DESCRIPTION:')) {
      parsed.meta_description = line.replace('META_DESCRIPTION:', '').trim();
    } else if (line.startsWith('TAGS:')) {
      parsed.tags = line.replace('TAGS:', '').trim();
    } else if (line.startsWith('TARGET_KEY_PHRASE:')) {
      parsed.target_key_phrase = line.replace('TARGET_KEY_PHRASE:', '').trim();
    } else if (currentSection && !line.startsWith('BODY')) {
      currentContent.push(line);
    }
  }
  
  // Handle the last section
  if (currentSection === 'body4') {
    parsed.body4 = currentContent.join('\n\n');
  }
  
  return parsed;
}

async function generateBlog(input, socketId, io) {
  try {
    emitStatus(socketId, 'started', 'Starting blog generation...', io);

    emitStatus(socketId, 'outline', 'Generating blog outline...', io);
    const outline = await generateOutline(input.title, input.primaryKeywords, input.angle, input.cta);

    emitStatus(socketId, 'article', 'Writing blog article...', io);
    const articleContent = await generateArticle(outline, input.title, input.primaryKeywords, input.angle, input.cta);

    emitStatus(socketId, 'parsing', 'Parsing article sections...', io);
    const parsedContent = parseArticleContent(articleContent);

    emitStatus(socketId, 'image-prompts', 'Generating image prompts...', io);
    const imagePrompts = await generateImagePrompts(articleContent, input.title);

    emitStatus(socketId, 'cover-image', 'Generating cover image...', io);
    const coverImageUrl = await generateImage(imagePrompts.cover, '16:9');
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const coverImageFilename = `gen-${timestamp}-${uniqueId}-cover.png`;
    const coverImageCDN = await uploadToStorage(coverImageUrl, coverImageFilename);

    emitStatus(socketId, 'section-images', 'Generating section images...', io);
    const sectionImageUrls = [];
    
    // Generate exactly 4 section images
    for (let i = 0; i < 4; i++) {
      emitStatus(socketId, 'section-images', `Generating section image ${i + 1} of 4...`, io);
      const imageUrl = await generateImage(imagePrompts.sections[i], '1:1');
      const filename = `gen-${timestamp}-${uniqueId}-body${i + 1}.png`;
      const cdnUrl = await uploadToStorage(imageUrl, filename);
      sectionImageUrls.push(cdnUrl);
    }

    emitStatus(socketId, 'saving', 'Saving to database...', io);
    const blogData = {
      title: input.title,
      sub_title: parsedContent.sub_title || null,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      heading1: parsedContent.heading1 || null,
      body1: parsedContent.body1 || null,
      image1: sectionImageUrls[0],
      heading2: parsedContent.heading2 || null,
      body2: parsedContent.body2 || null,
      image2: sectionImageUrls[1],
      heading3: parsedContent.heading3 || null,
      body3: parsedContent.body3 || null,
      image3: sectionImageUrls[2],
      heading4: parsedContent.heading4 || null,
      body4: parsedContent.body4 || null,
      image4: sectionImageUrls[3],
      conclusion: parsedContent.conclusion || null,
      final_cta: parsedContent.final_cta || null,
      meta_description: parsedContent.meta_description || null,
      tags: parsedContent.tags ? parsedContent.tags.split(',').map(tag => tag.trim()) : null,
      target_key_phrase: parsedContent.target_key_phrase || null,
      cover_image: coverImageCDN
    };

    const savedPost = await saveToSupabase(blogData);

    emitStatus(socketId, 'completed', 'Blog generation completed successfully!', io);

    return {
      success: true,
      message: 'Blog generated successfully',
      blogId: savedPost.id,
      data: savedPost
    };

  } catch (error) {
    emitStatus(socketId, 'error', `Error: ${error.message}`, io);
    throw error;
  }
}

async function updateBlogField(id, field, value) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ [field]: value })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    return {
      success: true,
      message: 'Field updated successfully',
      data: data[0]
    };
  } catch (error) {
    throw error;
  }
}

async function regenerateImage(id, imageField, prompt) {
  try {
    // Determine aspect ratio based on image field
    const aspectRatio = imageField === 'cover_image' ? '16:9' : '1:1';
    
    // Generate new image
    const imageUrl = await generateImage(prompt, aspectRatio);
    
    // Create unique filename
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const filename = `regen-${timestamp}-${uniqueId}-${imageField.replace('_', '-')}.png`;
    
    // Upload to storage
    const cdnUrl = await uploadToStorage(imageUrl, filename);
    
    // Update database
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ [imageField]: cdnUrl })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    return {
      success: true,
      message: 'Image regenerated successfully',
      imageUrl: cdnUrl,
      data: data[0]
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateBlog,
  updateBlogField,
  regenerateImage
};