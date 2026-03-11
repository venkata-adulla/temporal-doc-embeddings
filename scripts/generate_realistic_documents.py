#!/usr/bin/env python3
"""
Script to generate realistic sample documents for testing the Temporal Document Embeddings Platform.

This script creates realistic but non-copyrighted documents based on common business templates.
Documents are generated with proper lifecycle IDs, document types, and realistic content.

Usage:
    python scripts/generate_realistic_documents.py --output-dir ./sample_documents
    python scripts/generate_realistic_documents.py --industry procurement --count 15
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import random
import json

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))


def generate_procurement_documents(output_dir: Path, count: int = 15):
    """Generate procurement/supply chain documents."""
    vendors = ["Acme Corp", "Global Supplies Inc", "TechVendor Solutions", "Industrial Parts Co", "Material Source Ltd"]
    projects = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta", "Project Echo"]
    
    documents = []
    
    for i in range(1, count + 1):
        vendor = random.choice(vendors)
        project = random.choice(projects)
        lifecycle_id = f"lifecycle_procurement_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 90))
        
        # Purchase Order
        po_date = base_date
        po_content = f"""
PURCHASE ORDER

PO Number: PO-2024-{i:05d}
Date: {po_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Vendor: {vendor}
Project: {project}

Items:
1. Component A - Quantity: {random.randint(10, 100)} units - Unit Price: ${random.randint(50, 500)}.00
2. Component B - Quantity: {random.randint(5, 50)} units - Unit Price: ${random.randint(100, 1000)}.00
3. Service Package - Quantity: 1 - Unit Price: ${random.randint(1000, 5000)}.00

Subtotal: ${random.randint(10000, 50000)}.00
Tax: ${random.randint(500, 2500)}.00
Total: ${random.randint(10500, 52500)}.00

Delivery Date: {(po_date + timedelta(days=random.randint(14, 30))).strftime('%Y-%m-%d')}
Payment Terms: Net 30

Status: PENDING
"""
        po_file = output_dir / "procurement" / f"PO_2024_{vendor.replace(' ', '_')}_{project.replace(' ', '_')}_v1.txt"
        po_file.parent.mkdir(parents=True, exist_ok=True)
        po_file.write_text(po_content.strip())
        documents.append((str(po_file), lifecycle_id, "Purchase Order"))
        
        # Change Order (for some lifecycles)
        if random.random() > 0.4:  # 60% chance
            co_date = po_date + timedelta(days=random.randint(5, 15))
            co_content = f"""
CHANGE ORDER

CO Number: CO-2024-{i:05d}
Date: {co_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Related PO: PO-2024-{i:05d}

Vendor: {vendor}
Project: {project}

Change Reason: {'Price Adjustment' if random.random() > 0.5 else 'Delivery Delay'}

Original Amount: ${random.randint(10000, 50000)}.00
Change Amount: ${random.randint(-5000, 5000)}.00
New Total: ${random.randint(5000, 55000)}.00

New Delivery Date: {(co_date + timedelta(days=random.randint(10, 20))).strftime('%Y-%m-%d')}

Status: APPROVED
"""
            co_file = output_dir / "procurement" / f"CO_2024_PO_{i:05d}_{'PriceAdjustment' if random.random() > 0.5 else 'DeliveryDelay'}.txt"
            co_file.write_text(co_content.strip())
            documents.append((str(co_file), lifecycle_id, "Change Order"))
        
        # Invoice (for completed lifecycles)
        if random.random() > 0.3:  # 70% chance
            inv_date = po_date + timedelta(days=random.randint(20, 45))
            inv_content = f"""
INVOICE

Invoice Number: INV-2024-{i:05d}
Date: {inv_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Related PO: PO-2024-{i:05d}

Vendor: {vendor}
Project: {project}

Bill To:
Company XYZ
123 Business Street
City, State 12345

Items:
1. Component A - Quantity: {random.randint(10, 100)} units - Unit Price: ${random.randint(50, 500)}.00
2. Component B - Quantity: {random.randint(5, 50)} units - Unit Price: ${random.randint(100, 1000)}.00
3. Service Package - Quantity: 1 - Unit Price: ${random.randint(1000, 5000)}.00

Subtotal: ${random.randint(10000, 50000)}.00
Tax: ${random.randint(500, 2500)}.00
Total: ${random.randint(10500, 52500)}.00

Payment Due: {(inv_date + timedelta(days=30)).strftime('%Y-%m-%d')}
Status: {'PAID' if random.random() > 0.5 else 'PENDING'}
"""
            inv_file = output_dir / "procurement" / f"INV_2024_{vendor.replace(' ', '_')}_{project.replace(' ', '_')}_Final.txt"
            inv_file.write_text(inv_content.strip())
            documents.append((str(inv_file), lifecycle_id, "Invoice"))
    
    return documents


def generate_hr_documents(output_dir: Path, count: int = 15):
    """Generate HR/recruitment documents."""
    positions = ["Software Engineer", "Data Scientist", "Product Manager", "UX Designer", "DevOps Engineer"]
    candidates = ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Brown", 
                  "Sarah Wilson", "David Martinez", "Lisa Anderson", "James Taylor", "Jennifer Thomas"]
    
    documents = []
    
    for i in range(1, count + 1):
        candidate = random.choice(candidates)
        position = random.choice(positions)
        lifecycle_id = f"lifecycle_hr_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 60))
        
        # Resume
        resume_date = base_date
        resume_content = f"""
RESUME

Candidate: {candidate}
Date: {resume_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Position Applied: {position}

PROFESSIONAL SUMMARY
Experienced {position} with {random.randint(3, 10)} years of experience in software development and technology.

WORK EXPERIENCE
Senior {position} | Tech Company Inc | 2020 - Present
- Led development of multiple projects
- Managed team of {random.randint(3, 10)} engineers
- Achieved {random.randint(90, 100)}% project success rate

{position} | Previous Company | 2018 - 2020
- Developed and maintained software applications
- Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University Name | 2014 - 2018

SKILLS
- Programming Languages: Python, Java, JavaScript
- Frameworks: React, Node.js, Django
- Tools: Git, Docker, Kubernetes

Status: ACTIVE
"""
        resume_file = output_dir / "hr" / f"Resume_{candidate.replace(' ', '_')}_{position.replace(' ', '_')}_2024.txt"
        resume_file.parent.mkdir(parents=True, exist_ok=True)
        resume_file.write_text(resume_content.strip())
        documents.append((str(resume_file), lifecycle_id, "Resume"))
        
        # Application Form
        app_date = base_date + timedelta(days=1)
        app_content = f"""
APPLICATION FORM

Application ID: APP-2024-{i:05d}
Date: {app_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Candidate: {candidate}
Position: {position}

Personal Information:
- Email: {candidate.lower().replace(' ', '.')}@email.com
- Phone: +1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}
- Location: City, State

Availability: Immediate
Expected Salary: ${random.randint(80000, 150000)}/year

Status: SUBMITTED
"""
        app_file = output_dir / "hr" / f"Application_{candidate.replace(' ', '_')}_Position{i:03d}.txt"
        app_file.write_text(app_content.strip())
        documents.append((str(app_file), lifecycle_id, "Application"))
        
        # Interview Feedback
        if random.random() > 0.3:  # 70% chance
            interview_date = base_date + timedelta(days=random.randint(5, 10))
            round_num = random.randint(1, 3)
            interview_content = f"""
INTERVIEW FEEDBACK

Interview ID: INT-2024-{i:05d}
Date: {interview_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Candidate: {candidate}
Position: {position}
Round: {round_num}

Interviewer: Hiring Manager
Duration: {random.randint(30, 90)} minutes

Technical Skills: {'Strong' if random.random() > 0.3 else 'Moderate'}
Communication: {'Excellent' if random.random() > 0.4 else 'Good'}
Cultural Fit: {'High' if random.random() > 0.3 else 'Medium'}

Overall Rating: {random.randint(7, 10)}/10

Recommendation: {'Proceed to next round' if random.random() > 0.3 else 'Under consideration'}

Status: COMPLETED
"""
            int_file = output_dir / "hr" / f"Interview_Feedback_{candidate.replace(' ', '_')}_Round{round_num}.txt"
            int_file.write_text(interview_content.strip())
            documents.append((str(int_file), lifecycle_id, "Interview Feedback"))
        
        # Offer Letter
        if random.random() > 0.4:  # 60% chance
            offer_date = base_date + timedelta(days=random.randint(12, 20))
            offer_content = f"""
OFFER LETTER

Offer ID: OFF-2024-{i:05d}
Date: {offer_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Candidate: {candidate}
Position: {position}

Dear {candidate.split()[0]},

We are pleased to offer you the position of {position} at our company.

Offer Details:
- Start Date: {(offer_date + timedelta(days=random.randint(14, 30))).strftime('%Y-%m-%d')}
- Salary: ${random.randint(80000, 150000)}/year
- Benefits: Health, Dental, Vision, 401(k)
- Vacation: {random.randint(15, 25)} days per year

Please respond by {(offer_date + timedelta(days=7)).strftime('%Y-%m-%d')}.

Status: {'ACCEPTED' if random.random() > 0.4 else 'PENDING'}
"""
            offer_file = output_dir / "hr" / f"Offer_Letter_{candidate.replace(' ', '_')}_{'Initial' if random.random() > 0.5 else 'Revised_v2'}.txt"
            offer_file.write_text(offer_content.strip())
            documents.append((str(offer_file), lifecycle_id, "Offer Letter"))
    
    return documents


def generate_sales_documents(output_dir: Path, count: int = 15):
    """Generate sales/business development documents."""
    companies = ["TechStart Inc", "Enterprise Solutions", "Global Corp", "Innovation Labs", "Digital Services Co"]
    products = ["Enterprise Software", "Cloud Platform", "Consulting Services", "SaaS Solution", "Custom Development"]
    
    documents = []
    
    for i in range(1, count + 1):
        company = random.choice(companies)
        product = random.choice(products)
        lifecycle_id = f"lifecycle_sales_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 90))
        
        # Lead Form
        lead_date = base_date
        lead_content = f"""
LEAD INQUIRY

Lead ID: LEAD-2024-{i:05d}
Date: {lead_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Company: {company}
Contact Person: Contact Person Name
Email: contact@{company.lower().replace(' ', '')}.com
Phone: +1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}

Interest: {product}
Budget Range: ${random.randint(50000, 500000)}
Timeline: {random.choice(['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'])}

Source: {'Website' if random.random() > 0.5 else 'Referral'}
Status: NEW
"""
        lead_file = output_dir / "sales" / f"Lead_{company.replace(' ', '_')}_2024_{lead_date.strftime('%m_%d')}.txt"
        lead_file.parent.mkdir(parents=True, exist_ok=True)
        lead_file.write_text(lead_content.strip())
        documents.append((str(lead_file), lifecycle_id, "Lead"))
        
        # Proposal
        if random.random() > 0.2:  # 80% chance
            prop_date = base_date + timedelta(days=random.randint(3, 10))
            version = random.randint(1, 4)
            prop_content = f"""
PROPOSAL

Proposal ID: PROP-2024-{i:05d}
Date: {prop_date.strftime('%Y-%m-%d')}
Version: {version}
Lifecycle ID: {lifecycle_id}

Company: {company}
Product: {product}

Executive Summary:
We propose to deliver {product} to {company} with the following scope and pricing.

Scope of Work:
1. Implementation and setup
2. Training and support
3. Maintenance and updates

Pricing:
- Base Package: ${random.randint(50000, 200000)}
- Additional Services: ${random.randint(10000, 50000)}
- Total: ${random.randint(60000, 250000)}

Timeline: {random.randint(30, 90)} days
Payment Terms: 50% upfront, 50% on completion

Status: {'SENT' if version == 1 else 'REVISED'}
"""
            prop_file = output_dir / "sales" / f"Proposal_{company.replace(' ', '_')}_Project{i:03d}_v{version}.txt"
            prop_file.write_text(prop_content.strip())
            documents.append((str(prop_file), lifecycle_id, "Proposal"))
        
        # Contract
        if random.random() > 0.5:  # 50% chance
            contract_date = base_date + timedelta(days=random.randint(15, 30))
            contract_content = f"""
CONTRACT AGREEMENT

Contract ID: CONT-2024-{i:05d}
Date: {contract_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Parties:
- Provider: Our Company
- Client: {company}

Product/Service: {product}

Terms and Conditions:
1. Delivery: {random.randint(30, 90)} days from contract signing
2. Payment: ${random.randint(60000, 250000)} total
3. Warranty: {random.randint(12, 36)} months
4. Support: Included for first year

Signatures:
Provider: _________________ Date: {contract_date.strftime('%Y-%m-%d')}
Client: _________________ Date: {contract_date.strftime('%Y-%m-%d')}

Status: {'SIGNED' if random.random() > 0.3 else 'PENDING'}
"""
            contract_file = output_dir / "sales" / f"Contract_{company.replace(' ', '_')}_2024_ServiceAgreement.txt"
            contract_file.write_text(contract_content.strip())
            documents.append((str(contract_file), lifecycle_id, "Contract"))
    
    return documents


def generate_healthcare_documents(output_dir: Path, count: int = 15):
    """Generate healthcare/medical documents (anonymized)."""
    patient_ids = [f"PAT{i:05d}" for i in range(1001, 1001 + count)]
    conditions = ["Hypertension", "Diabetes", "Cardiac Condition", "Respiratory Issue", "General Checkup"]
    
    documents = []
    
    for i in range(1, count + 1):
        patient_id = patient_ids[i-1]
        condition = random.choice(conditions)
        lifecycle_id = f"lifecycle_healthcare_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 180))
        
        # Patient Record
        record_date = base_date
        record_content = f"""
PATIENT RECORD

Patient ID: {patient_id}
Date: {record_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Age: {random.randint(25, 75)}
Gender: {random.choice(['M', 'F'])}
Condition: {condition}

Vital Signs:
- Blood Pressure: {random.randint(110, 140)}/{random.randint(70, 90)}
- Heart Rate: {random.randint(60, 100)} bpm
- Temperature: {random.uniform(97.0, 99.5):.1f}°F

Diagnosis: {condition}
Treatment Plan: Medication and monitoring

Status: ACTIVE
"""
        record_file = output_dir / "healthcare" / f"PatientRecord_{patient_id}_2024_{record_date.strftime('%m')}.txt"
        record_file.parent.mkdir(parents=True, exist_ok=True)
        record_file.write_text(record_content.strip())
        documents.append((str(record_file), lifecycle_id, "Patient Record"))
        
        # Lab Results
        if random.random() > 0.3:  # 70% chance
            lab_date = base_date + timedelta(days=random.randint(1, 7))
            lab_content = f"""
LAB RESULTS

Lab ID: LAB-2024-{i:05d}
Date: {lab_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Patient ID: {patient_id}

Test Type: Blood Work

Results:
- Glucose: {random.randint(70, 140)} mg/dL
- Cholesterol: {random.randint(150, 250)} mg/dL
- Hemoglobin: {random.randint(12, 16)} g/dL

Status: {'NORMAL' if random.random() > 0.3 else 'REVIEW'}
"""
            lab_file = output_dir / "healthcare" / f"LabResults_{patient_id}_BloodWork.txt"
            lab_file.write_text(lab_content.strip())
            documents.append((str(lab_file), lifecycle_id, "Lab Results"))
        
        # Prescription
        if random.random() > 0.4:  # 60% chance
            presc_date = base_date + timedelta(days=random.randint(1, 5))
            presc_content = f"""
PRESCRIPTION

Prescription ID: RX-2024-{i:05d}
Date: {presc_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Patient ID: {patient_id}

Medication: Medication Name {random.randint(1, 5)}mg
Dosage: {random.randint(1, 2)} tablet(s) daily
Duration: {random.randint(7, 30)} days
Refills: {random.randint(0, 3)}

Prescribing Physician: Dr. Smith
Pharmacy: Local Pharmacy

Status: ACTIVE
"""
            presc_file = output_dir / "healthcare" / f"Prescription_{patient_id}_Medication.txt"
            presc_file.write_text(presc_content.strip())
            documents.append((str(presc_file), lifecycle_id, "Prescription"))
    
    return documents


def generate_legal_documents(output_dir: Path, count: int = 15):
    """Generate legal/compliance documents."""
    clients = ["Client A Corp", "Client B LLC", "Client C Inc", "Client D Partners", "Client E Group"]
    matter_types = ["Contract Review", "Compliance Audit", "Regulatory Filing", "Litigation Support", "Policy Review"]
    
    documents = []
    
    for i in range(1, count + 1):
        client = random.choice(clients)
        matter = random.choice(matter_types)
        lifecycle_id = f"lifecycle_legal_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 180))
        
        # Contract
        contract_date = base_date
        contract_content = f"""
LEGAL CONTRACT

Contract ID: LEG-2024-{i:05d}
Date: {contract_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}

Client: {client}
Matter Type: {matter}

Parties:
1. {client}
2. Counterparty Name

Terms:
- Effective Date: {contract_date.strftime('%Y-%m-%d')}
- Expiration Date: {(contract_date + timedelta(days=random.randint(365, 1095))).strftime('%Y-%m-%d')}
- Value: ${random.randint(100000, 1000000)}

Key Provisions:
1. Scope of services
2. Payment terms
3. Confidentiality
4. Termination clauses

Status: {'EXECUTED' if random.random() > 0.4 else 'DRAFT'}
"""
        contract_file = output_dir / "legal" / f"Contract_{client.replace(' ', '_')}_ServiceAgreement_2024.txt"
        contract_file.parent.mkdir(parents=True, exist_ok=True)
        contract_file.write_text(contract_content.strip())
        documents.append((str(contract_file), lifecycle_id, "Contract"))
        
        # Compliance Report
        if random.random() > 0.4:  # 60% chance
            report_date = base_date + timedelta(days=random.randint(10, 30))
            report_content = f"""
COMPLIANCE REPORT

Report ID: COMP-2024-{i:05d}
Date: {report_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Client: {client}

Compliance Area: {random.choice(['Data Privacy', 'Financial Regulations', 'Industry Standards'])}
Period: Q{random.randint(1, 4)} 2024

Findings:
- Total Issues: {random.randint(0, 5)}
- Critical: {random.randint(0, 2)}
- Moderate: {random.randint(0, 3)}
- Low: {random.randint(0, 2)}

Recommendations:
1. Update policies and procedures
2. Conduct additional training
3. Implement monitoring systems

Status: {'COMPLIANT' if random.random() > 0.4 else 'REVIEW_REQUIRED'}
"""
            report_file = output_dir / "legal" / f"ComplianceReport_Q{random.randint(1, 4)}_2024_DataPrivacy.txt"
            report_file.write_text(report_content.strip())
            documents.append((str(report_file), lifecycle_id, "Compliance Report"))
    
    return documents


def generate_finance_documents(output_dir: Path, count: int = 15):
    """Generate finance/accounting documents."""
    departments = ["Sales", "Marketing", "Operations", "IT", "HR"]
    
    documents = []
    
    for i in range(1, count + 1):
        department = random.choice(departments)
        lifecycle_id = f"lifecycle_finance_{i:03d}"
        base_date = datetime.now() - timedelta(days=random.randint(1, 90))
        
        # Financial Statement
        stmt_date = base_date
        stmt_content = f"""
FINANCIAL STATEMENT

Statement ID: FIN-2024-{i:05d}
Date: {stmt_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Period: Q{random.randint(1, 4)} 2024

Revenue: ${random.randint(1000000, 10000000):,}
Cost of Goods Sold: ${random.randint(500000, 5000000):,}
Gross Profit: ${random.randint(500000, 5000000):,}

Operating Expenses:
- Salaries: ${random.randint(200000, 2000000):,}
- Marketing: ${random.randint(50000, 500000):,}
- Operations: ${random.randint(100000, 1000000):,}

Net Income: ${random.randint(100000, 2000000):,}

Status: {'FINAL' if random.random() > 0.3 else 'DRAFT'}
"""
        stmt_file = output_dir / "finance" / f"FinancialStatement_Q{random.randint(1, 4)}_2024.txt"
        stmt_file.parent.mkdir(parents=True, exist_ok=True)
        stmt_file.write_text(stmt_content.strip())
        documents.append((str(stmt_file), lifecycle_id, "Financial Statement"))
        
        # Expense Report
        if random.random() > 0.3:  # 70% chance
            exp_date = base_date + timedelta(days=random.randint(1, 30))
            exp_content = f"""
EXPENSE REPORT

Report ID: EXP-2024-{i:05d}
Date: {exp_date.strftime('%Y-%m-%d')}
Lifecycle ID: {lifecycle_id}
Department: {department}
Employee: Employee {i:03d}

Expenses:
1. Travel: ${random.randint(500, 3000):.2f}
2. Meals: ${random.randint(100, 500):.2f}
3. Supplies: ${random.randint(50, 300):.2f}
4. Other: ${random.randint(100, 1000):.2f}

Total: ${random.randint(750, 4800):.2f}

Status: {'APPROVED' if random.random() > 0.4 else 'PENDING'}
"""
            exp_file = output_dir / "finance" / f"ExpenseReport_Employee{i:03d}_2024_{exp_date.strftime('%m')}.txt"
            exp_file.write_text(exp_content.strip())
            documents.append((str(exp_file), lifecycle_id, "Expense Report"))
    
    return documents


def main():
    parser = argparse.ArgumentParser(
        description="Generate realistic sample documents for testing"
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='./sample_documents',
        help='Output directory for generated documents (default: ./sample_documents)'
    )
    parser.add_argument(
        '--industry',
        type=str,
        choices=['all', 'procurement', 'hr', 'sales', 'healthcare', 'legal', 'finance'],
        default='all',
        help='Industry to generate documents for (default: all)'
    )
    parser.add_argument(
        '--count',
        type=int,
        default=15,
        help='Number of lifecycles per industry (default: 15)'
    )
    parser.add_argument(
        '--manifest',
        type=str,
        help='Output JSON manifest file with document metadata'
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    all_documents = []
    
    industries = {
        'procurement': generate_procurement_documents,
        'hr': generate_hr_documents,
        'sales': generate_sales_documents,
        'healthcare': generate_healthcare_documents,
        'legal': generate_legal_documents,
        'finance': generate_finance_documents,
    }
    
    if args.industry == 'all':
        for industry_name, generator_func in industries.items():
            print(f"\nGenerating {industry_name} documents...")
            docs = generator_func(output_dir, args.count)
            all_documents.extend(docs)
            print(f"  Generated {len(docs)} documents")
    else:
        print(f"\nGenerating {args.industry} documents...")
        docs = industries[args.industry](output_dir, args.count)
        all_documents.extend(docs)
        print(f"  Generated {len(docs)} documents")
    
    # Create manifest
    manifest = {
        'generated_at': datetime.now().isoformat(),
        'total_documents': len(all_documents),
        'documents': [
            {
                'file': doc[0],
                'lifecycle_id': doc[1],
                'document_type': doc[2]
            }
            for doc in all_documents
        ]
    }
    
    if args.manifest:
        manifest_file = Path(args.manifest)
        manifest_file.write_text(json.dumps(manifest, indent=2))
        print(f"\nManifest saved to: {manifest_file}")
    else:
        manifest_file = output_dir / "manifest.json"
        manifest_file.write_text(json.dumps(manifest, indent=2))
        print(f"\nManifest saved to: {manifest_file}")
    
    print(f"\n{'='*60}")
    print(f"Generation Complete!")
    print(f"  Total documents: {len(all_documents)}")
    print(f"  Output directory: {output_dir}")
    print(f"  Manifest: {manifest_file}")
    print(f"\nNext steps:")
    print(f"  1. Review generated documents in: {output_dir}")
    print(f"  2. Upload using: python scripts/upload_real_world_documents.py --directory {output_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
