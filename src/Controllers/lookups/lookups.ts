// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getCourseOfferingRepository, getCourseRepository, getFacultyProfileRepository, getProgramRepository,getQuestionRepository,getUserRepository,getSubjectRepository, getTopicRepository } from '../../dependencies'; // <--- Get the service via getter


const router = Router();

    
    router.route('/programs/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const programs = await programService.getPrograms(activeTenantId!);//pass tenantId here as parameter
            var programsAsLookup=programs.map(item => {
                const { id, programName } = item; // Destructure to extract id and name
                return { label: programName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(programsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve programs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve programs: " + error.message });
        }
    });
 
    router.route('/subjects/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const subjectService = getSubjectRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const subjects = await subjectService.getSubjects(activeTenantId!);//pass tenantId here as parameter
            var subjectsAsLookup=subjects.map(item => {
                const { id, subjectName } = item; // Destructure to extract id and name
                return { label: subjectName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(subjectsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve subjects:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve subjects: " + error.message });
        }
    });

    
    router.route('/courses/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const courses = await courseService.getCourses(activeTenantId!);//pass tenantId here as parameter
            var coursesAsLookup=courses.map(item => {
                const { id, courseName } = item; // Destructure to extract id and name
                return { label: courseName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(coursesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve courses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courses: " + error.message });
        }
    });

    

    router.route('/courseofferings/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const courseofferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const courseofferings = await courseofferingService.getCourseOfferings(activeTenantId!);//pass tenantId here as parameter
            var courseofferingsAsLookup=courseofferings.map(item => {
                const { id, offeringName } = item; // Destructure to extract id and name
                return { label: offeringName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(courseofferingsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve courseoggerings:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courseofferings: " + error.message });
        }
    });

    router.route('/courseofferings/ptenantId/:ptenantId/personId/:personId')
    .get(async (req: Request, res: Response) => {

console.log('.................yes courseoffering of faculty thru personid getting called');
var personId= parseInt(req.params.personId);

        try {
            
            const courseofferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const courseofferings = await courseofferingService.getCourseOfferingsByFacultyIdThruPersonId(personId,activeTenantId!);//pass tenantId here as parameter
            var courseofferingsAsLookup=courseofferings.map(item => {
                const { id, offeringName } = item; // Destructure to extract id and name
                return { label: offeringName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(courseofferingsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve courseoggerings:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courseofferings: " + error.message });
        }
    });

    router.route('/topics/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const topicService = getTopicRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const topics = await topicService.getTopics(activeTenantId!);//pass tenantId here as parameter
            var topicsAsLookup=topics.map(item => {
                const { id, topicName } = item; // Destructure to extract id and name
                return { label: topicName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(topicsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve topics:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve topics: " + error.message });
        }
    });

    //facultyProfiles
    router.route('/facultyProfiles/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const facultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const facultyProfiles = await facultyProfileService.getFacultyProfiles(activeTenantId!);//pass tenantId here as parameter
            var facultyProfilesAsLookup=facultyProfiles.map(item => {
                const { id, person,department } = item; // Destructure to extract id and name
                return { label: person.firstName+'-'+person.lastName+' ('+department+')', value:id };      // Return a new object with only id and name
              });
            res.status(200).json(facultyProfilesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve facultyProfiles:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve facultyProfiles: " + error.message });
        }
    });

    //questionTypes
    router.route('/questionTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const questionTypes = await questionService.getQuestionTypes();//pass tenantId here as parameter
            var questionTypesAsLookup=questionTypes.map(item => {
                const {  typeName } = item; // Destructure to extract id and name
                return { label: typeName, value:typeName };      // Return a new object with only id and name
              });
            res.status(200).json(questionTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve questionTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve questionType: " + error.message });
        }
    });


    //questionCategorys
    router.route('/questionCategorys/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const questionCategorys = await questionService.getQuestionCategories();//pass tenantId here as parameter
            var questionCategorysAsLookup=questionCategorys.map(item => {
                const {  categoryName } = item; // Destructure to extract id and name
                return { label: categoryName, value:categoryName };      // Return a new object with only id and name
              });
            res.status(200).json(questionCategorysAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve questionCategorys:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve questionCategory: " + error.message });
        }
    });
    
    //
    router.route('/questionPurposes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const questionPurposes = await questionService.getQuestionPurposes();//pass tenantId here as parameter
            var questionPurposesAsLookup=questionPurposes.map(item => {
                const {  purposeName } = item; // Destructure to extract id and name
                return { label: purposeName, value:purposeName };      // Return a new object with only id and name
              });
            res.status(200).json(questionPurposesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve questionPurposes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve questionPurposes: " + error.message });
        }
    });

    
    //roleTypes
    router.route('/roleTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const roleTypes = await userService.getUserRoles();//pass tenantId here as parameter
            var roleTypesAsLookup=roleTypes.map(item => {
                const {  rolename } = item; // Destructure to extract id and name
                return { label: rolename, value:rolename };      // Return a new object with only id and name
              });
            res.status(200).json(roleTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve roleTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve roleType: " + error.message });
        }
    });

router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
            const programId = parseInt(req.params.id, 10);
            if (isNaN(programId)) {
            //    return res.status(400).json({ message: 'Invalid Program ID format.' });
            }
            
            const program = await programService.getById(programId);
            
            if (program) {            
               
                res.status(200).json(program);
            } else {
                res.status(404).json({ 'message': 'Program not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve program by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving program.' });
        }
    })

export default router;