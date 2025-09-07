SELECT s.subjectCode, s.name, COUNT(e.id) AS studentCount
FROM ai_scale_app_subject s
LEFT JOIN ai_scale_app_enrolment e ON e.subjectId_id = s.id
GROUP BY s.subjectCode, s.name
ORDER BY studentCount DESC;

-- finding all courses coordinated by a specific coordinator
SELECT s.subjectCode, s.name
FROM ai_scale_app_subject s
JOIN ai_scale_app_user u ON s.coordinatorId_id = u.id
WHERE u.email = 'coordinator@gmail.com';

-- templates owned or shared by a user
SELECT DISTINCT t.id, t.name
FROM ai_scale_app_template t
LEFT JOIN ai_scale_app_templateownership o ON o.templateId_id = t.id
WHERE t.ownerId_id = (SELECT id FROM ai_scale_app_user WHERE email = 'owner@gmail.com')
   OR o.ownerId_id = (SELECT id FROM ai_scale_app_user WHERE email = 'owner@gmail.com');

-- all items for a given template
SELECT ti.id, ti.task, ti.aiUseScaleLevel, ti.useAcknowledgement
FROM ai_scale_app_templateitem ti
WHERE ti.templateId_id = 1
ORDER BY ti.id;

-- rubrics with their item counts
SELECT r.id, r.name, COUNT(ri.id) AS itemCount
FROM ai_scale_app_rubric r
LEFT JOIN ai_scale_app_rubricitem ri ON ri.rubricId_id = r.id
GROUP BY r.id, r.name
ORDER BY itemCount DESC;

-- all acknowledgement forms for a rubric
SELECT af.id, af.name
FROM ai_scale_app_acknowledgementform af
WHERE af.rubricId_id = 2;


-- items in an acknowledgement form 
SELECT afi.id, afi.aiToolsUsed, afi.purposeUsage, afi.keyPromptsUsed
FROM ai_scale_app_acknowledgementformitem afi
WHERE afi.ackFormId_id = 5;
