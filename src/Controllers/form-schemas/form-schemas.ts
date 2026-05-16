// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';

import FormSchemaService from '../../services/FormSchemaService'
const router = Router();


    
// router.route('/:formName')
//     .get(async (req: Request<{ formName: string }>, res: Response) => {
        
// 			const formName = req.params.formName;
// 			if (formName === 'student-enrollment') {
// 				res.json(studentEnrollmentSchema); // In real app, fetch from DB
// 			}
// 			if (formName === 'student-enrollment') {
// 				res.json(studentEnrollmentSchema); // In real app, fetch from DB
// 			} else {
// 				res.status(404).send('Schema not found');
// 			}
//     })

router.route('/:formName')
    .get(async (req: Request<{ formName: string }>, res: Response) => {
        const formName = req.params.formName;
        if (formName === 'student-enrollment') {
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Enrollment());
		 // res.json(studentEnrollmentSchema)
        }
        //
        
        else  if (formName === 'program') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Program());
		 // res.json(studentEnrollmentSchema)
        }
        //
        else  if (formName === 'programcourse') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_ProgramCourse());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'course') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Course());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'subject') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Subject());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'courseoffering') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_CourseOffering());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'facultyprofile') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_FacultyProfile());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'question') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Question());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'assignment') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_Assignment());
		 // res.json(studentEnrollmentSchema)
        }
        else  if (formName === 'assignmentSolving') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_AssignmentSolving());
		 // res.json(studentEnrollmentSchema)
        }
         //
        else  if (formName === 'assignmentSolving_SingleQuestion') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_AssignmentSolving_SingleQuestion());
		 
        }else  if (formName === 'assignmentsForAssessment') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_AssignmentAssessment());
		 // res.json(studentEnrollmentSchema)
        }
       
        else  if (formName === 'assessAssignment') {
           
            // In a real app, you'd fetch studentEnrollmentSchema from your DB here
            res.json(await new FormSchemaService().getSchema_assessAssignment());
		 
        }
        // Add more 'else if' conditions for other form names
        // else if (formName === 'teacher-profile') {
        //     res.json(teacherProfileSchema);
        // }
        else { // If no matching formName is found
            res.status(404).send('Schema not found');
        }
    });


export default router;