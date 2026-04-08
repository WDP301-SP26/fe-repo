import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formulas = [
  {
    code: 'ATTENDANCE_ONLY',
    name: 'Attendance only',
    description: 'Chi dung ti le diem danh trong cac buoi review session.',
  },
  {
    code: 'PROBLEM_RESOLUTION_CONTRIBUTION',
    name: 'Problem resolution + contribution',
    description:
      'Can bang tien do giai quyet van de voi muc do dong gop commit/task.',
  },
  {
    code: 'ATTENDANCE_PROBLEM_CONTRIBUTION',
    name: 'Attendance + problem + contribution',
    description:
      'Tong hop diem danh, ket qua giai quyet van de va dong gop thuc te.',
  },
  {
    code: 'CUSTOM_SELECTION',
    name: 'Custom selection',
    description:
      'Giang vien tu chon metric de tinh auto score cho checkpoint hien tai.',
  },
];

export default function LecturerReviewScoringGuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Badge variant="secondary">Lecturer guide</Badge>
        <h1 className="text-2xl font-bold md:text-3xl">
          Checkpoint Scoring Guide
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Huong dan nhanh cho 3 diem thanh phan, cong thuc tinh diem tu dong va
          cach su dung final score override.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1) 3 diem thanh phan can nhap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Task progress score (0-10): muc do hoan thanh task theo checkpoint.
          </p>
          <p>
            Commit contribution score (0-10): chat luong va muc do dong gop qua
            commit/repo.
          </p>
          <p>
            Milestone review score (0-10): danh gia tong quan trong buoi review
            checkpoint.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Cong thuc auto score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {formulas.map((formula) => (
            <div key={formula.code} className="rounded-md border p-3">
              <p className="font-medium text-foreground">
                {formula.name}{' '}
                <span className="text-xs text-muted-foreground">
                  ({formula.code})
                </span>
              </p>
              <p className="mt-1">{formula.description}</p>
            </div>
          ))}
          <p>
            Luu y: Auto score la diem de xuat. Ban van co the override final
            score neu can.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3) Final score override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Neu nhap final score khac auto score, ban bat buoc dien override
            reason de giai trinh.
          </p>
          <p>
            Khuyen nghi: chi override khi co bang chung ro rang (bao cao buoi
            review, minh chung commit/task, attendance record).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4) Checklist truoc khi Save checkpoint draft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Da nhap du 3 diem thanh phan trong khoang 0-10.</p>
          <p>2. Da chon dung scoring formula cho checkpoint hien tai.</p>
          <p>3. Neu override diem, da dien ly do ro rang.</p>
          <p>4. Da cap nhat nhan xet Lecturer note neu can.</p>
        </CardContent>
      </Card>
    </div>
  );
}
